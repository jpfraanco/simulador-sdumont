// data/openmp-files.js
// Fake C files and job scripts for the OpenMP module.
// Loaded into the simulated filesystem at boot.

export const OPENMP_FILES = {
    '/prj/palmvein/unseen/openmp/hello.c': `#include <stdio.h>
#include <omp.h>

int main() {
    #pragma omp parallel
    {
        int tid = omp_get_thread_num();
        int total = omp_get_num_threads();
        printf("Oi do thread %d de %d\\n", tid, total);
    }
    printf("Fim — voltou pra thread master.\\n");
    return 0;
}
`,

    '/prj/palmvein/unseen/openmp/palm_preprocess.c': `#include <stdio.h>
#include <omp.h>

// Simula pré-processamento de imagem IR de veia palmar:
// resize, normalize, augmentação (flip, rotate, contrast)
void process_image(int id) {
    volatile int work = 0;
    for (int i = 0; i < 100000; i++) work++;
}

int main() {
    int N = 16800;  // 16.800 imagens IR do dataset palm vein
    double start = omp_get_wtime();

    #pragma omp parallel for schedule(dynamic)
    for (int i = 0; i < N; i++) {
        process_image(i);
    }

    double elapsed = omp_get_wtime() - start;
    int threads = omp_get_max_threads();
    printf("Processadas %d imagens em %.2fs com %d threads\\n",
           N, elapsed, threads);
    printf("Speedup estimado: %.1fx\\n", 33.6 / elapsed);
    return 0;
}
`,

    '/prj/palmvein/unseen/openmp/race_bug.c': `#include <stdio.h>
#include <omp.h>

// BUG: race condition no cálculo de EER do palm vein
// Roda várias vezes — resultado muda a cada execução!

int main() {
    int N = 100000;
    int true_pos = 0;
    int false_pos = 0;

    #pragma omp parallel for
    for (int i = 0; i < N; i++) {
        // Simula score de comparação veia palmar
        float score = (float)(i * 7 % 100) / 100.0;
        float threshold = 0.5;
        int genuine = (i % 3 == 0);  // 1/3 genuíno, 2/3 impostor

        if (score > threshold) {
            if (genuine)
                true_pos++;    // ⚠️ RACE CONDITION
            else
                false_pos++;   // ⚠️ RACE CONDITION
        }
    }
    printf("True Positives:  %d  (esperado: ~16667)\\n", true_pos);
    printf("False Positives: %d  (esperado: ~33333)\\n", false_pos);
    printf("Total matches:   %d  (esperado: 50000)\\n", true_pos + false_pos);
    return 0;
}
`,

    '/prj/palmvein/unseen/openmp/race_fixed.c': `#include <stdio.h>
#include <omp.h>

// CORRIGIDO: usa reduction pra evitar race condition

int main() {
    int N = 100000;
    int true_pos = 0;
    int false_pos = 0;

    #pragma omp parallel for reduction(+:true_pos) reduction(+:false_pos)
    for (int i = 0; i < N; i++) {
        float score = (float)(i * 7 % 100) / 100.0;
        float threshold = 0.5;
        int genuine = (i % 3 == 0);

        if (score > threshold) {
            if (genuine)
                true_pos++;    // ✅ Cada thread soma no seu contador privado
            else
                false_pos++;   // ✅ reduction combina no final
        }
    }
    printf("True Positives:  %d  (esperado: 16667)\\n", true_pos);
    printf("False Positives: %d  (esperado: 33333)\\n", false_pos);
    printf("Total matches:   %d  (esperado: 50000)\\n", true_pos + false_pos);
    printf("Resultado DETERMINISTICO — sempre o mesmo.\\n");
    return 0;
}
`,

    '/prj/palmvein/unseen/openmp/openmp_job.srm': `#!/bin/bash
#SBATCH --job-name=palm-preprocess-omp
#SBATCH -p sequana_cpu
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=16
#SBATCH --time=00:30:00
#SBATCH --output=slurm-%j.out

echo "Job OpenMP pré-processamento palm vein"
echo "Nó: $SLURM_JOB_NODELIST"
echo "Cores alocados: $SLURM_CPUS_PER_TASK"

module load gcc/13.2_sequana

cd $SLURM_SUBMIT_DIR

# Compila com suporte OpenMP
gcc -fopenmp -O2 openmp/palm_preprocess.c -o palm_preprocess

# OMP_NUM_THREADS é setado automaticamente pelo SLURM
# baseado em --cpus-per-task
export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK

echo "Rodando com $OMP_NUM_THREADS threads..."
srun ./palm_preprocess

echo "Pronto."
`
};
