// data/tour-gpu.js
// Módulo 3: GPU / CUDA — Programação de Aceleradores
// Interseções: palm vein biometrics + SDumont 2nd (H100 SXM, --gres=gpu, NCCL)
// Cada passo tem código CUDA real, compilação simulada, execução no terminal.

export const ETAPAS = [
    { num: 0, id: 'gpu-motivacao',   titulo: 'Por que GPU?',           descricao: 'CPU vs GPU, SIMT, milhares de cores' },
    { num: 1, id: 'gpu-host-device', titulo: 'Host vs Device',         descricao: 'Memória separada, cudaMalloc, cudaMemcpy' },
    { num: 2, id: 'gpu-primeiro',    titulo: 'Primeiro kernel',        descricao: 'Hello World na GPU com threads e blocks' },
    { num: 3, id: 'gpu-palm',        titulo: 'Kernel palm vein',       descricao: 'Normalizar 16.800 imagens IR na GPU' },
    { num: 4, id: 'gpu-grid',        titulo: 'Grid, blocks e threads', descricao: 'threadIdx, blockIdx, blockDim — a hierarquia CUDA' },
    { num: 5, id: 'gpu-memoria',     titulo: 'Memória GPU',            descricao: 'Global, shared, coalescência' },
    { num: 6, id: 'gpu-multigpu',    titulo: 'Multi-GPU',              descricao: '4× H100 SXM, NCCL, cudaSetDevice' },
    { num: 7, id: 'gpu-pytorch',     titulo: 'PyTorch under the hood', descricao: 'Como model.to("cuda") usa CUDA por baixo' },
    { num: 8, id: 'gpu-sdumont',     titulo: 'Job GPU no SDumont',     descricao: '--gres=gpu:4, partição lncc-h100, módulos' }
];

export const STEPS = [

    // ========== ETAPA 0: Por que GPU? ==========
    {
        id: 'gpu-0.1-cpu-vs-gpu', etapa: 0, subpasso: 1,
        titulo: 'CPU é um canivete suíço. GPU é uma fábrica.',
        narracao: `
            <p>No módulo de OpenMP você aprendeu a dividir trabalho entre 48 cores de CPU. Funcionou bem — o pré-processamento de 16.800 imagens caiu de 33.6s pra ~1.1s. Mas e se precisasse processar 1 milhão de imagens? Ou rodar inferência num modelo pesado?</p>
            <p>Aí entra a <strong>GPU</strong>. Comparação simplificada:</p>
            <ul>
                <li><strong>CPU (AMD EPYC Genoa-X):</strong> 96 cores potentes, cada um roda lógica complexa, branch prediction, cache grande. Bom pra tarefas <em>variadas</em>.</li>
                <li><strong>GPU (NVIDIA H100 SXM):</strong> 16.896 cores CUDA simples, cada um faz operações matemáticas básicas (soma, multiplica). Bom pra tarefas <em>massivamente paralelas</em>.</li>
            </ul>
            <p>A GPU é como uma fábrica com 16 mil operários fazendo a mesma tarefa simples ao mesmo tempo. A CPU é como 96 engenheiros que podem fazer qualquer coisa, mas são só 96.</p>
            <p>Para palm vein: normalizar pixels, extrair features, rodar convoluções de uma ResNet — tudo isso é multiplicação de matrizes. <strong>Trabalho perfeito pra GPU.</strong></p>
        `
    },
    {
        id: 'gpu-0.2-simt', etapa: 0, subpasso: 2,
        titulo: 'SIMT: Single Instruction, Multiple Threads',
        narracao: `
            <p>O modelo da GPU é <strong>SIMT</strong> (Single Instruction, Multiple Threads): milhares de threads executam a <em>mesma instrução</em> ao mesmo tempo, cada uma em dados diferentes.</p>
            <p>Exemplo concreto: normalizar 16.800 imagens de 128×128 pixels = <strong>275 milhões de pixels</strong>. A normalização de cada pixel é: <code>pixel = (pixel - min) / (max - min)</code>.</p>
            <ul>
                <li><strong>CPU (48 cores OpenMP):</strong> cada core processa ~5.7 milhões de pixels sequencialmente → ~1.1s</li>
                <li><strong>GPU (H100):</strong> lança 275M threads, cada uma normaliza 1 pixel → <strong>~0.4ms</strong></li>
            </ul>
            <p>Sim, milissegundos. A GPU é ~2.700× mais rápida que a CPU neste caso. Não porque cada core é mais rápido (é mais lento!), mas porque tem <strong>milhares</strong> deles.</p>
            <p>Vamos ver como funciona na prática. Primeiro, veja os arquivos CUDA disponíveis:</p>
            <pre><code>ls cuda/</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^ls\s+cuda/
    },

    // ========== ETAPA 1: Host vs Device ==========
    {
        id: 'gpu-1.1-conceito', etapa: 1, subpasso: 1,
        titulo: 'Dois mundos: CPU (host) e GPU (device)',
        narracao: `
            <p>Em CUDA, o código roda em <strong>dois mundos</strong> com memórias separadas:</p>
            <ul>
                <li><strong>Host</strong> = CPU + RAM. Seu programa normal em C roda aqui. É onde você carrega imagens do disco, prepara dados, lança kernels.</li>
                <li><strong>Device</strong> = GPU + VRAM (Video RAM). Os kernels CUDA rodam aqui. A H100 tem 80 GB de HBM3 — memória ultra-rápida (3.35 TB/s), mas <strong>separada</strong> da RAM.</li>
            </ul>
            <p>O fluxo CUDA é sempre:</p>
            <ol>
                <li><code>cudaMalloc()</code> — aloca memória na GPU</li>
                <li><code>cudaMemcpy(Host→Device)</code> — copia dados da RAM pra VRAM</li>
                <li><code>kernel<<<blocks, threads>>>()</code> — roda o cálculo na GPU</li>
                <li><code>cudaMemcpy(Device→Host)</code> — copia resultado de volta pra RAM</li>
                <li><code>cudaFree()</code> — libera memória da GPU</li>
            </ol>
            <p>Esse vai-e-volta de dados é o principal <strong>gargalo</strong> — por isso, o ideal é manter os dados na GPU o máximo possível. No palm vein: carregar as 16.800 imagens uma vez, fazer todo o pré-processamento na GPU, e só copiar o resultado final.</p>
        `
    },

    // ========== ETAPA 2: Primeiro kernel CUDA ==========
    {
        id: 'gpu-2.1-hello', etapa: 2, subpasso: 1,
        titulo: 'O menor programa CUDA do mundo',
        narracao: `
            <p>Vamos ao código. Um kernel CUDA é uma função marcada com <code>__global__</code> — ela roda na GPU mas é chamada pela CPU:</p>
            <pre><code>__global__ void hello_kernel() {
    int tid = threadIdx.x;   // ID da thread no block
    int bid = blockIdx.x;    // ID do block no grid
    printf("Oi da GPU! Block %d, Thread %d\\n", bid, tid);
}

// Na CPU:
hello_kernel<<<2, 4>>>();  // 2 blocks × 4 threads = 8 threads</code></pre>
            <p>O <code>&lt;&lt;&lt;2, 4&gt;&gt;&gt;</code> é a sintaxe mágica de CUDA pra lançar o kernel: <strong>2 blocks</strong>, cada um com <strong>4 threads</strong>. As 8 threads rodam em paralelo na GPU.</p>
            <p>Veja o código completo:</p>
            <pre><code>cat cuda/hello_gpu.cu</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+cuda\/hello_gpu\.cu/
    },
    {
        id: 'gpu-2.2-compilar', etapa: 2, subpasso: 2,
        titulo: 'Compilando com nvcc',
        narracao: `
            <p>CUDA usa o compilador <code>nvcc</code> (NVIDIA CUDA Compiler) em vez do <code>gcc</code>. No SDumont, primeiro carregue os módulos:</p>
            <pre><code>module load arch_gpu/current
module load cuda/12.4</code></pre>
            <p>E depois compile:</p>
            <pre><code>nvcc hello_gpu.cu -o hello_gpu</code></pre>
            <p>O <code>nvcc</code> separa o código: parte que roda na CPU vai pro GCC, parte que roda na GPU vai pro compilador PTX (assembly da NVIDIA). No final junta tudo num executável.</p>
            <p>Compile agora:</p>
            <pre><code>nvcc cuda/hello_gpu.cu -o hello_gpu</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^nvcc\s+(cuda\/)?hello_gpu/
    },
    {
        id: 'gpu-2.3-rodar', etapa: 2, subpasso: 3,
        titulo: 'Rodando na GPU',
        narracao: `
            <p>Agora roda o programa. Diferente do OpenMP, aqui <strong>não precisa</strong> de variável de ambiente — a quantidade de threads é definida no código (<code>&lt;&lt;&lt;blocks, threads&gt;&gt;&gt;</code>).</p>
            <pre><code>./hello_gpu</code></pre>
            <p>Repare que as mensagens podem vir em qualquer ordem — as threads da GPU rodam em paralelo, sem ordem garantida.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^\.\/hello_gpu/
    },

    // ========== ETAPA 3: Kernel palm vein ==========
    {
        id: 'gpu-3.1-normalize', etapa: 3, subpasso: 1,
        titulo: 'Caso real: normalizar imagens IR na GPU',
        narracao: `
            <p>Agora o caso do palm vein. Queremos normalizar 16.800 imagens infravermelhas de 128×128 pixels. Total: <strong>275 milhões de pixels</strong>. Cada pixel vira:</p>
            <pre><code>pixel_normalizado = (pixel - min) / (max - min)</code></pre>
            <p>O kernel CUDA:</p>
            <pre><code>__global__ void normalize_ir(float *images, int total_pixels,
                              float min_val, float max_val) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < total_pixels) {
        images[idx] = (images[idx] - min_val) / (max_val - min_val);
    }
}</code></pre>
            <p>Cada thread processa <strong>1 pixel</strong>. Lançamos 275M threads (organizadas em blocks de 128). A GPU agenda tudo automaticamente.</p>
            <p>Veja o código completo:</p>
            <pre><code>cat cuda/palm_normalize.cu</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+cuda\/palm_normalize\.cu/
    },
    {
        id: 'gpu-3.2-compilar-rodar', etapa: 3, subpasso: 2,
        titulo: 'Compilando e comparando com CPU',
        narracao: `
            <p>Compile e rode para ver a diferença bruta CPU vs GPU:</p>
            <pre><code>nvcc cuda/palm_normalize.cu -o palm_normalize
./palm_normalize</code></pre>
            <p>Compile agora:</p>
            <pre><code>nvcc cuda/palm_normalize.cu -o palm_normalize</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^nvcc\s+(cuda\/)?palm_normalize/
    },
    {
        id: 'gpu-3.3-resultado', etapa: 3, subpasso: 3,
        titulo: 'Resultado: GPU vs CPU',
        narracao: `
            <p>Rode o programa e veja a comparação:</p>
            <pre><code>./palm_normalize</code></pre>
            <p>A GPU processa tudo em <strong>milissegundos</strong> — incluindo a cópia de dados Host↔Device. Repare que boa parte do tempo é gasta na <strong>transferência</strong>, não no cálculo. Isso é típico: kernels simples são limitados pela <strong>bandwidth de memória</strong>, não pelo compute.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^\.\/palm_normalize/
    },

    // ========== ETAPA 4: Grid, blocks e threads ==========
    {
        id: 'gpu-4.1-hierarquia', etapa: 4, subpasso: 1,
        titulo: 'A hierarquia: Grid → Block → Thread',
        narracao: `
            <p>CUDA organiza threads em 3 níveis:</p>
            <ul>
                <li><strong>Grid</strong> = todas as threads do kernel. Dividido em blocks.</li>
                <li><strong>Block</strong> = grupo de até 1024 threads. Threads no mesmo block <strong>compartilham memória shared</strong> e podem sincronizar entre si.</li>
                <li><strong>Thread</strong> = unidade mínima de execução.</li>
            </ul>
            <p>No exemplo do palm_normalize:</p>
            <pre><code>int threadsPerBlock = 128;
int numBlocks = (275M + 127) / 128;  // = 2.148.438 blocks!
normalize_ir<<<numBlocks, threadsPerBlock>>>(...);</code></pre>
            <p>Dentro do kernel, cada thread calcula seu índice global:</p>
            <pre><code>int idx = blockIdx.x * blockDim.x + threadIdx.x;</code></pre>
            <ul>
                <li><code>threadIdx.x</code> = posição da thread dentro do block (0 a 127)</li>
                <li><code>blockIdx.x</code> = índice do block dentro do grid (0 a 2.148.437)</li>
                <li><code>blockDim.x</code> = tamanho do block (128)</li>
            </ul>
            <p>Pense assim: blockIdx é o <strong>andar</strong> do prédio, threadIdx é o <strong>apartamento</strong> naquele andar, e idx é o <strong>endereço absoluto</strong>.</p>
        `
    },

    // ========== ETAPA 5: Memória GPU ==========
    {
        id: 'gpu-5.1-tipos', etapa: 5, subpasso: 1,
        titulo: 'Tipos de memória na GPU',
        narracao: `
            <p>A GPU tem uma hierarquia de memória parecida com a CPU, mas com nomes diferentes:</p>
            <ul>
                <li><strong>Global Memory (HBM3):</strong> 80 GB na H100. Acessível por todas as threads. Lenta (~3.35 TB/s). É onde ficam os arrays de imagens.</li>
                <li><strong>Shared Memory:</strong> 228 KB por SM (Streaming Multiprocessor). Compartilhada entre threads do <strong>mesmo block</strong>. Ultra-rápida (~33 TB/s). Tipo um "cache manual" que você controla.</li>
                <li><strong>Registradores:</strong> por thread. Mais rápidos de todos, mas limitados (~255 por thread).</li>
            </ul>
            <p>Para palm vein: se cada block processa um tile de 128 pixels de uma imagem, você pode carregar esses 128 pixels na shared memory uma vez e fazer múltiplas operações (normalizar, filtrar, calcular gradiente) sem ir à global memory cada vez.</p>
        `
    },
    {
        id: 'gpu-5.2-coalescencia', etapa: 5, subpasso: 2,
        titulo: 'Coalescência: acessar memória do jeito certo',
        narracao: `
            <p>A regra de ouro da performance GPU: <strong>threads adjacentes devem acessar endereços adjacentes</strong>. Isso se chama <strong>acesso coalescido</strong>.</p>
            <pre><code>// ✅ BOM — coalescido: thread i acessa pixel i
images[idx] = (images[idx] - min) / range;

// ❌ RUIM — não-coalescido: stride de N
images[idx * N] = ...;  // threads 0,1,2,3 acessam posições 0, N, 2N, 3N</code></pre>
            <p>Quando o acesso é coalescido, a GPU busca um bloco de 128 bytes de uma vez (32 threads × 4 bytes), numa única transação. Sem coalescência, faz 32 transações separadas. A diferença pode ser <strong>10-30×</strong> em performance.</p>
            <p>No palm vein: como nossas imagens são arrays contíguos, o acesso já é naturalmente coalescido. Mas se usar layout SoA (Structure of Arrays) em vez de AoS (Array of Structures), precisa ter cuidado.</p>
        `
    },

    // ========== ETAPA 6: Multi-GPU ==========
    {
        id: 'gpu-6.1-multi', etapa: 6, subpasso: 1,
        titulo: '4 GPUs H100: dividir e conquistar',
        narracao: `
            <p>Os nós H100 do SDumont 2nd têm <strong>4 GPUs H100 SXM</strong> conectadas via NVLink (900 GB/s). Podemos distribuir as 16.800 imagens entre as 4 GPUs: 4.200 por GPU.</p>
            <p>O código usa <code>cudaSetDevice(g)</code> pra selecionar qual GPU vai receber cada fatia:</p>
            <pre><code>for (int g = 0; g < 4; g++) {
    cudaSetDevice(g);          // Seleciona GPU g
    cudaMalloc(&d_data[g], ...);  // Aloca na GPU g
    normalize_ir<<<blocks, 128>>>(d_data[g], ...);
}</code></pre>
            <p>Veja o código completo:</p>
            <pre><code>cat cuda/multi_gpu.cu</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+cuda\/multi_gpu\.cu/
    },
    {
        id: 'gpu-6.2-compilar', etapa: 6, subpasso: 2,
        titulo: 'Multi-GPU na prática',
        narracao: `
            <p>Compile e rode para ver as 4 GPUs em ação:</p>
            <pre><code>nvcc cuda/multi_gpu.cu -o multi_gpu
./multi_gpu</code></pre>
            <p>Compile:</p>
            <pre><code>nvcc cuda/multi_gpu.cu -o multi_gpu</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^nvcc\s+(cuda\/)?multi_gpu/
    },
    {
        id: 'gpu-6.3-rodar', etapa: 6, subpasso: 3,
        titulo: 'Resultado multi-GPU',
        narracao: `
            <p>Execute:</p>
            <pre><code>./multi_gpu</code></pre>
            <p>Repare que o speedup de 4 GPUs não é exatamente 4×. Existe overhead de sincronização e comunicação. Na prática, 3.5-3.8× é excelente com 4 GPUs.</p>
            <p>Para treino de modelos (ResNet palm vein), o framework que mais se beneficia de multi-GPU é o <strong>PyTorch com DistributedDataParallel (DDP)</strong>, que usa NCCL por baixo. Você não precisa escrever CUDA — o PyTorch faz tudo.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^\.\/multi_gpu/
    },

    // ========== ETAPA 7: PyTorch under the hood ==========
    {
        id: 'gpu-7.1-pytorch', etapa: 7, subpasso: 1,
        titulo: 'model.to("cuda") — o que acontece por baixo?',
        narracao: `
            <p>Quando você escreve em Python:</p>
            <pre><code>model = ResNet101().to('cuda')
images = images.to('cuda')
output = model(images)</code></pre>
            <p>O PyTorch faz exatamente o que aprendemos:</p>
            <ol>
                <li><code>.to('cuda')</code> → <code>cudaMalloc</code> + <code>cudaMemcpy</code> (copia os pesos do modelo pra VRAM)</li>
                <li><code>model(images)</code> → lança <strong>centenas de kernels CUDA</strong> em sequência (convoluções, batch norm, ReLU, pooling)</li>
                <li>Cada kernel é otimizado pela cuDNN (biblioteca da NVIDIA pra deep learning)</li>
            </ol>
            <p>Então todo CUDA que você aprendeu neste módulo é o que acontece <strong>por baixo</strong> do PyTorch. O framework esconde a complexidade, mas entender o que ele faz te ajuda a otimizar.</p>
            <p>Vamos verificar se o PyTorch enxerga as GPUs:</p>
            <pre><code>python cuda/pytorch_check.py</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^python.*pytorch_check/
    },

    // ========== ETAPA 8: Job GPU no SDumont ==========
    {
        id: 'gpu-8.1-job', etapa: 8, subpasso: 1,
        titulo: 'Job script CUDA no SDumont 2nd',
        narracao: `
            <p>Para usar GPU no SDumont, a diferença principal no job script é o <code>--gres=gpu:N</code>:</p>
            <pre><code>#SBATCH -p lncc-h100          # Partição com GPUs H100
#SBATCH --gres=gpu:4           # Pede 4 GPUs
#SBATCH --cpus-per-task=16     # CPUs pro host (data loading)</code></pre>
            <p>O <code>--gres=gpu:4</code> diz ao SLURM: "aloca um nó com 4 GPUs disponíveis". As GPUs ficam visíveis via <code>CUDA_VISIBLE_DEVICES</code>.</p>
            <p>Os módulos necessários:</p>
            <pre><code>module load arch_gpu/current   # Arquitetura H100
module load cuda/12.4          # CUDA Toolkit
module load gcc/13.2           # Compilador C</code></pre>
            <p>Veja o job script completo:</p>
            <pre><code>cat cuda/cuda_job.srm</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+cuda\/cuda_job\.srm/
    },
    {
        id: 'gpu-8.2-submeter', etapa: 8, subpasso: 2,
        titulo: 'Submetendo o job GPU',
        narracao: `
            <p>Submeta o job e observe na fila — ele vai pra partição <code>lncc-h100</code>:</p>
            <pre><code>sbatch cuda/cuda_job.srm</code></pre>
            <p>Olha o dashboard à direita: o job aparece na fila e, quando começar a rodar, um nó H100 fica amarelo. Pode verificar com <code>squeue</code> depois.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^sbatch\s+cuda\/cuda_job\.srm/
    },
    {
        id: 'gpu-8.3-nvidia-smi', etapa: 8, subpasso: 3,
        titulo: 'nvidia-smi: monitorando a GPU',
        narracao: `
            <p>Para ver o estado das GPUs num nó, use <code>nvidia-smi</code> — é o "top" das GPUs. Mostra utilização, memória usada, temperatura, processos.</p>
            <p>Como estamos no login (que tem L40S), vamos ver a saída simulada. Num nó H100, mostraria 4× H100 SXM com 80 GB cada.</p>
            <pre><code>nvidia-smi</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^nvidia-smi/
    },
    {
        id: 'gpu-8.4-fim', etapa: 8, subpasso: 4,
        titulo: 'Resumo: GPU/CUDA na prática',
        narracao: `
            <p>O que você aprendeu neste módulo:</p>
            <ul>
                <li>✅ <strong>GPU</strong> tem milhares de cores simples — ideal pra tarefas massivamente paralelas como processar imagens</li>
                <li>✅ <strong>Host (CPU) vs Device (GPU)</strong> — memórias separadas, cudaMalloc/cudaMemcpy pra transferir dados</li>
                <li>✅ <strong>Kernel</strong> = função que roda na GPU, lançada com <code>&lt;&lt;&lt;blocks, threads&gt;&gt;&gt;</code></li>
                <li>✅ <strong>Hierarquia Grid→Block→Thread</strong> — threadIdx + blockIdx = índice global</li>
                <li>✅ <strong>Memória:</strong> global (lenta, grande), shared (rápida, pequena), registradores (ultra-rápidos)</li>
                <li>✅ <strong>Coalescência:</strong> threads adjacentes acessam memória adjacente = performance máxima</li>
                <li>✅ <strong>Multi-GPU:</strong> cudaSetDevice + dividir dados entre GPUs — speedup ~3.7× com 4 GPUs</li>
                <li>✅ <strong>PyTorch</strong> faz tudo isso por baixo — <code>.to('cuda')</code> = cudaMalloc + cudaMemcpy</li>
                <li>✅ No SDumont: <code>--gres=gpu:4</code> + <code>module load cuda/12.4</code></li>
            </ul>
            <p>No <strong>próximo módulo (MPI)</strong>, você vai aprender a distribuir trabalho entre <strong>múltiplos nós</strong> — combinando GPUs de máquinas diferentes pra treino distribuído. 🚀</p>
        `
    }
];

// Helper functions (same interface as tour.js and tour-openmp.js)
export function getStepById(id) { return STEPS.find(s => s.id === id); }
export function getStepIndex(id) { return STEPS.findIndex(s => s.id === id); }
export function getNextStep(currentId) {
    const i = getStepIndex(currentId);
    return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
}
export function getPreviousStep(currentId) {
    const i = getStepIndex(currentId);
    return i > 0 ? STEPS[i - 1] : null;
}
export function getFirstStepOfEtapa(etapaNum) {
    return STEPS.find(s => s.etapa === etapaNum);
}
