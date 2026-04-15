// data/cuda-files.js
// Fake CUDA files and job scripts for the GPU module.
// Loaded into the simulated filesystem at boot.

export const CUDA_FILES = {
    '/scratch/palmvein/unseen/cuda/hello_gpu.cu': `#include <stdio.h>

// Kernel: função que roda na GPU
// __global__ = pode ser chamado do host (CPU)
__global__ void hello_kernel() {
    int tid = threadIdx.x;          // ID da thread dentro do block
    int bid = blockIdx.x;           // ID do block dentro do grid
    printf("Oi da GPU! Block %d, Thread %d\\n", bid, tid);
}

int main() {
    // Mostra qual GPU estamos usando
    cudaDeviceProp prop;
    cudaGetDeviceProperties(&prop, 0);
    printf("GPU 0: %s — CUDA %d.%d\\n\\n", prop.name, prop.major, prop.minor);

    // Lança kernel com 2 blocks de 4 threads cada
    // <<<numBlocks, threadsPerBlock>>>
    hello_kernel<<<2, 4>>>();

    // Espera a GPU terminar
    cudaDeviceSynchronize();

    printf("\\nKernel executou com 2 blocks × 4 threads = 8 threads GPU\\n");
    return 0;
}
`,

    '/scratch/palmvein/unseen/cuda/palm_normalize.cu': `#include <stdio.h>
#include <cuda_runtime.h>

// Kernel: normaliza imagens IR de veia palmar
// Cada thread processa 1 pixel: valor = (pixel - min) / (max - min)
__global__ void normalize_ir(float *images, int total_pixels,
                              float min_val, float max_val) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < total_pixels) {
        images[idx] = (images[idx] - min_val) / (max_val - min_val);
    }
}

int main() {
    int N_images = 16800;
    int W = 128, H = 128;
    int total_pixels = N_images * W * H;
    size_t bytes = total_pixels * sizeof(float);

    printf("Normalizando %d imagens IR (%dx%d) na GPU...\\n", N_images, W, H);
    printf("  Alocados %lu MB na GPU (%d × %d × %d × float)\\n",
           bytes / (1024*1024), N_images, W, H);

    // 1. Alocar memória na GPU
    float *d_images;
    cudaMalloc(&d_images, bytes);

    // 2. Copiar dados CPU → GPU
    float *h_images = (float*)malloc(bytes);
    for (int i = 0; i < total_pixels; i++) h_images[i] = (float)(i % 256);

    cudaMemcpy(d_images, h_images, bytes, cudaMemcpyHostToDevice);

    // 3. Lançar kernel
    int threadsPerBlock = 128;
    int numBlocks = (total_pixels + threadsPerBlock - 1) / threadsPerBlock;
    normalize_ir<<<numBlocks, threadsPerBlock>>>(d_images, total_pixels, 0.0f, 255.0f);
    cudaDeviceSynchronize();

    // 4. Copiar resultado GPU → CPU
    cudaMemcpy(h_images, d_images, bytes, cudaMemcpyDeviceToHost);

    printf("  Speedup GPU vs CPU-seq: ~1400x\\n");

    cudaFree(d_images);
    free(h_images);
    return 0;
}
`,

    '/scratch/palmvein/unseen/cuda/multi_gpu.cu': `#include <stdio.h>
#include <cuda_runtime.h>

// Normaliza imagens distribuídas entre múltiplas GPUs
__global__ void normalize_ir(float *images, int n_pixels,
                              float min_val, float max_val) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n_pixels) {
        images[idx] = (images[idx] - min_val) / (max_val - min_val);
    }
}

int main() {
    int num_gpus;
    cudaGetDeviceCount(&num_gpus);
    printf("Distribuindo 16800 imagens entre %d GPUs H100...\\n\\n", num_gpus);

    int N_images = 16800;
    int per_gpu = N_images / num_gpus;
    int pixels_per_img = 128 * 128;

    for (int g = 0; g < num_gpus; g++) {
        cudaSetDevice(g);  // Seleciona GPU g

        int n_pixels = per_gpu * pixels_per_img;
        float *d_data;
        cudaMalloc(&d_data, n_pixels * sizeof(float));

        // Cada GPU processa sua fatia
        int blocks = (n_pixels + 127) / 128;
        normalize_ir<<<blocks, 128>>>(d_data, n_pixels, 0.0f, 255.0f);

        printf("  GPU %d: %d imagens processadas\\n", g, per_gpu);
        cudaFree(d_data);
    }

    // Sincroniza todas as GPUs
    for (int g = 0; g < num_gpus; g++) {
        cudaSetDevice(g);
        cudaDeviceSynchronize();
    }

    printf("\\nTodas as GPUs finalizaram.\\n");
    return 0;
}
`,

    '/scratch/palmvein/unseen/cuda/pytorch_check.py': `import torch

print(f"PyTorch {torch.__version__}")
print(f"CUDA disponível: {torch.cuda.is_available()}")
print(f"Dispositivos: {torch.cuda.device_count()}")
for i in range(torch.cuda.device_count()):
    props = torch.cuda.get_device_properties(i)
    print(f"  GPU {i}: {props.name} ({props.total_mem // (1024**2)} MB)")

# Teste básico
t = torch.tensor([1.0, 2.0, 3.0]).cuda()
print(f"\\nTeste: {t}")
print("model.to('cuda') → move pesos para GPU 0")
`,

    '/scratch/palmvein/unseen/cuda/cuda_job.srm': `#!/bin/bash
#SBATCH --job-name=palm-normalize-gpu
#SBATCH -p lncc-h100
#SBATCH --account=palmvein
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=16
#SBATCH --gres=gpu:4
#SBATCH --time=01:00:00
#SBATCH --output=slurm-%j.out

echo "Job CUDA normalização palm vein"
echo "Nó: $SLURM_JOB_NODELIST"
echo "GPUs alocadas: $SLURM_GPUS_ON_NODE"

# Carregar módulos necessários
module load arch_gpu/current
module load gcc/13.2
module load cuda/12.4

cd $SLURM_SUBMIT_DIR

# Compilar código CUDA
nvcc -O2 cuda/palm_normalize.cu -o palm_normalize

echo "Rodando normalização de 16800 imagens na GPU..."
srun ./palm_normalize

echo "Pronto."
`
};
