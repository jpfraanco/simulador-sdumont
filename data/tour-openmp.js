// data/tour-openmp.js
// Módulo 2: OpenMP / Multicore — Paralelismo em CPU
// Interseções: palm vein biometrics + SDumont (--cpus-per-task, sockets, compilação)
// Cada passo tem código C real, compilação simulada, execução no terminal.

export const ETAPAS = [
    { num: 0, id: 'omp-motivacao',  titulo: 'Por que paralelismo?',   descricao: 'O problema do código sequencial e como o paralelismo resolve' },
    { num: 1, id: 'omp-conceitos',  titulo: 'Conceitos básicos',      descricao: 'Threads, memória compartilhada, fork-join' },
    { num: 2, id: 'omp-primeiro',   titulo: 'Primeiro #pragma',       descricao: 'Hello World paralelo no SDumont' },
    { num: 3, id: 'omp-for',        titulo: 'Parallel for',           descricao: 'Dividir um loop entre threads — processamento de imagens' },
    { num: 4, id: 'omp-escopo',     titulo: 'Escopo de variáveis',    descricao: 'private, shared, race conditions e como evitar' },
    { num: 5, id: 'omp-reduction',  titulo: 'Reduction',              descricao: 'Agregar resultados parciais sem conflito' },
    { num: 6, id: 'omp-sync',       titulo: 'Sincronização',          descricao: 'critical, atomic, barrier — proteger dados' },
    { num: 7, id: 'omp-sdumont',    titulo: 'OpenMP no SDumont',      descricao: 'Job script, --cpus-per-task, OMP_NUM_THREADS, sockets' },
    { num: 8, id: 'omp-speedup',    titulo: 'Speedup e Amdahl',       descricao: 'Medir ganho real, lei de Amdahl, eficiência' }
];

export const STEPS = [

    // ========== ETAPA 0: Por que paralelismo? ==========
    {
        id: 'omp-0.1-problema', etapa: 0, subpasso: 1,
        titulo: 'Seu treino de palm vein demora. E agora?',
        narracao: `
            <p>Imagina o seguinte: você tem 16.800 imagens infravermelhas de veias palmares.
            Precisa pré-processar cada uma (redimensionar, normalizar, aplicar augmentação).
            Num código sequencial, você processa <strong>uma imagem por vez</strong>:</p>
            <pre><code>for (int i = 0; i < 16800; i++) {
    process_image(images[i]);  // ~2ms por imagem
}
// Total: 16800 × 2ms = 33.6 segundos</code></pre>
            <p>33 segundos não parece muito. Mas e se o dataset crescer pra 1 milhão de imagens? Ou se cada imagem precisar de processamento mais pesado (feature extraction, matching contra um banco)?</p>
            <p><strong>Num único core</strong>, você está limitado pela velocidade de clock desse core. Não importa se o nó do SDumont tem 48 cores — seu código só usa 1.</p>
        `
    },
    {
        id: 'omp-0.2-solucao', etapa: 0, subpasso: 2,
        titulo: 'A solução: dividir o trabalho entre cores',
        narracao: `
            <p>A ideia do <strong>paralelismo</strong> é simples: se você tem 48 cores disponíveis, por que não dividir as 16.800 imagens entre eles?</p>
            <ul>
                <li><strong>1 core:</strong> 16.800 imagens → 33.6s</li>
                <li><strong>4 cores:</strong> 4.200 cada → ~8.4s</li>
                <li><strong>16 cores:</strong> 1.050 cada → ~2.1s</li>
                <li><strong>48 cores:</strong> 350 cada → ~0.7s</li>
            </ul>
            <p>Isso é o que chamamos de <strong>speedup</strong>: quantas vezes mais rápido ficou. Com 48 cores, o speedup ideal seria 48×. Na prática é menos (overhead de coordenação, memória compartilhada, etc.), mas o ganho é enorme.</p>
            <p>O <strong>OpenMP</strong> é a ferramenta que permite fazer essa divisão em C/C++ com <strong>uma única linha de código</strong> adicionada ao loop.</p>
        `
    },

    // ========== ETAPA 1: Conceitos básicos ==========
    {
        id: 'omp-1.1-threads', etapa: 1, subpasso: 1,
        titulo: 'Processos vs Threads',
        narracao: `
            <p>Antes de mexer com OpenMP, dois conceitos fundamentais:</p>
            <ul>
                <li><strong>Processo</strong> = um programa rodando. Tem seu próprio espaço de memória isolado. Pesado pra criar/destruir. É o que o SLURM gerencia (cada "tarefa" do <code>--ntasks</code> é um processo).</li>
                <li><strong>Thread</strong> = um fluxo de execução <em>dentro</em> de um processo. Threads do mesmo processo <strong>compartilham a mesma memória</strong>. Leve pra criar/destruir. É o que o OpenMP usa.</li>
            </ul>
            <p>Analogia: um <strong>processo</strong> é uma cozinha inteira (espaço isolado, equipamentos próprios). Uma <strong>thread</strong> é um cozinheiro dentro dessa cozinha — vários cozinheiros dividem o mesmo fogão, a mesma geladeira, os mesmos ingredientes.</p>
            <p>No SDumont, quando você pede <code>--cpus-per-task=16</code>, está dando 16 cores pra um <strong>processo</strong>. O OpenMP cria 16 <strong>threads</strong> dentro desse processo, uma por core.</p>
        `
    },
    {
        id: 'omp-1.2-memoria', etapa: 1, subpasso: 2,
        titulo: 'Memória compartilhada: vantagem e risco',
        narracao: `
            <p>A grande vantagem de threads é que elas <strong>compartilham memória</strong>. Isso significa que se uma thread carregou uma imagem na RAM, outra thread pode acessar essa mesma imagem instantaneamente, sem copiar dados.</p>
            <p>Para o palm vein: seu array de 16.800 imagens fica na memória <strong>uma vez só</strong>, e todas as threads lêem dele. Eficiente.</p>
            <p>Mas aí vem o risco: se duas threads tentam <strong>escrever no mesmo lugar ao mesmo tempo</strong>, dá conflito. Exemplo clássico:</p>
            <pre><code>int contador = 0;
// 4 threads rodando em paralelo:
// Thread 0: lê contador (0), soma 1, escreve 1
// Thread 1: lê contador (0), soma 1, escreve 1  ← leu ANTES da Thread 0 escrever!
// Resultado: contador = 1 (deveria ser 2)</code></pre>
            <p>Isso se chama <strong>race condition</strong> (condição de corrida). O OpenMP tem ferramentas pra evitar isso — a gente vê na etapa 5.</p>
        `
    },
    {
        id: 'omp-1.3-forkjoin', etapa: 1, subpasso: 3,
        titulo: 'Fork-Join: como o OpenMP funciona',
        narracao: `
            <p>O modelo do OpenMP é o <strong>fork-join</strong>:</p>
            <ol>
                <li><strong>Fork:</strong> quando o programa chega numa região paralela, a thread principal (chamada <em>master</em>) cria N threads adicionais. Agora tem N+1 threads rodando ao mesmo tempo.</li>
                <li><strong>Trabalho:</strong> cada thread executa sua parte do código (por exemplo, processar 350 imagens do total de 16.800).</li>
                <li><strong>Join:</strong> quando todas terminam, as threads extras são destruídas e o programa volta a ser sequencial (só a master).</li>
            </ol>
            <p>É como um gerente (master) que contrata temporários (threads) pra um mutirão, faz o trabalho, e dispensa todo mundo no final. Isso pode acontecer <strong>milhares de vezes</strong> durante a execução — cada loop paralelo é um fork-join.</p>
        `
    },

    // ========== ETAPA 2: Primeiro #pragma ==========
    {
        id: 'omp-2.1-hello', etapa: 2, subpasso: 1,
        titulo: 'O menor programa OpenMP do mundo',
        narracao: `
            <p>Vamos ver como é na prática. Olha este código C:</p>
            <pre><code>#include &lt;stdio.h&gt;
#include &lt;omp.h&gt;

int main() {
    #pragma omp parallel
    {
        int tid = omp_get_thread_num();
        int total = omp_get_num_threads();
        printf("Oi do thread %d de %d\\n", tid, total);
    }
    return 0;
}</code></pre>
            <p>A mágica é o <code>#pragma omp parallel</code>. Essa <strong>diretiva</strong> diz ao compilador: "o bloco de código entre as chaves deve ser executado por <strong>todas as threads em paralelo</strong>".</p>
            <p>Sem essa linha, o código rodaria sequencial e imprimiria só uma vez. Com ela, se você tem 4 cores, imprime 4 vezes (uma por thread).</p>
            <p>Vamos compilar e rodar. Digita no terminal:</p>
            <pre><code>cat openmp/hello.c</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+openmp\/hello\.c/
    },
    {
        id: 'omp-2.2-compilar', etapa: 2, subpasso: 2,
        titulo: 'Compilando com -fopenmp',
        narracao: `
            <p>Pra compilar código OpenMP, você precisa da flag <code>-fopenmp</code> (no GCC) ou <code>-qopenmp</code> (no Intel). Sem ela, o compilador <strong>ignora</strong> todos os <code>#pragma omp</code> e o código roda sequencial.</p>
            <p>No SDumont, primeiro carrega o módulo do compilador e depois compila:</p>
            <pre><code>gcc -fopenmp hello.c -o hello</code></pre>
            <p>Digita esse comando agora.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^gcc\s+-fopenmp/
    },
    {
        id: 'omp-2.3-rodar', etapa: 2, subpasso: 3,
        titulo: 'Rodando com 4 threads',
        narracao: `
            <p>Agora vamos rodar. O OpenMP usa a variável de ambiente <code>OMP_NUM_THREADS</code> pra saber quantas threads criar. Se não setada, usa o número de cores disponíveis.</p>
            <p>Vamos forçar 4 threads e rodar:</p>
            <pre><code>OMP_NUM_THREADS=4 ./hello</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /OMP_NUM_THREADS.*\.\/hello|\.\/hello/
    },

    // ========== ETAPA 3: Parallel for (imagens palm vein) ==========
    {
        id: 'omp-3.1-for', etapa: 3, subpasso: 1,
        titulo: 'Dividindo o processamento de imagens',
        narracao: `
            <p>Agora o caso real. Seu pipeline de palm vein precisa pré-processar 16.800 imagens IR. Vamos paralelizar com <code>#pragma omp parallel for</code>:</p>
            <pre><code>#include &lt;stdio.h&gt;
#include &lt;omp.h&gt;

void process_image(int id) {
    // Simula: resize, normalize, augment
    // Na vida real: OpenCV + albumentations
    volatile int work = 0;
    for (int i = 0; i < 100000; i++) work++;
}

int main() {
    int N = 16800;
    double start = omp_get_wtime();

    #pragma omp parallel for schedule(dynamic)
    for (int i = 0; i < N; i++) {
        process_image(i);
    }

    double elapsed = omp_get_wtime() - start;
    int threads = omp_get_max_threads();
    printf("Processadas %d imagens em %.2fs com %d threads\\n",
           N, elapsed, threads);
    return 0;
}</code></pre>
            <p>O <code>#pragma omp parallel for</code> divide automaticamente as iterações do loop entre as threads. Se tiver 8 threads, cada uma processa ~2100 imagens.</p>
            <p>O <code>schedule(dynamic)</code> significa que as iterações são distribuídas sob demanda: thread que acabar primeiro pega mais trabalho. Bom quando o tempo de processamento varia entre imagens.</p>
            <p>Veja o código:</p>
            <pre><code>cat openmp/palm_preprocess.c</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+openmp\/palm_preprocess\.c/
    },
    {
        id: 'omp-3.2-compilar-rodar', etapa: 3, subpasso: 2,
        titulo: 'Compilando e testando com diferentes threads',
        narracao: `
            <p>Compila e roda com quantidades diferentes de threads pra ver o speedup:</p>
            <pre><code>gcc -fopenmp palm_preprocess.c -o palm_preprocess
OMP_NUM_THREADS=1 ./palm_preprocess
OMP_NUM_THREADS=4 ./palm_preprocess
OMP_NUM_THREADS=16 ./palm_preprocess
OMP_NUM_THREADS=48 ./palm_preprocess</code></pre>
            <p>Digita o primeiro comando (<code>gcc -fopenmp palm_preprocess.c -o palm_preprocess</code>).</p>
        `,
        destaque: '#terminal',
        esperaComando: /^gcc\s+-fopenmp\s+palm_preprocess/
    },

    // ========== ETAPA 4: Escopo de variáveis ==========
    {
        id: 'omp-4.1-bug', etapa: 4, subpasso: 1,
        titulo: 'O bug clássico: race condition no EER',
        narracao: `
            <p>Imagina que você está calculando o <strong>EER</strong> (Equal Error Rate) do seu modelo palm vein. Precisa contar quantas comparações deram "match correto" vs "falso positivo". Código ingênuo:</p>
            <pre><code>int true_positives = 0;
int false_positives = 0;

#pragma omp parallel for
for (int i = 0; i < N_comparisons; i++) {
    float score = compare(probe[i], gallery[i]);
    if (score > threshold) {
        if (is_genuine[i])
            true_positives++;   // ⚠️ RACE CONDITION!
        else
            false_positives++;  // ⚠️ RACE CONDITION!
    }
}</code></pre>
            <p>O problema: <code>true_positives++</code> não é atômico. Quando duas threads fazem isso ao mesmo tempo, uma <strong>sobrescreve</strong> o incremento da outra. O resultado final é <strong>menor</strong> que o correto, e seu EER sai errado.</p>
            <p>Veja o bug em ação:</p>
            <pre><code>cat openmp/race_bug.c</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+openmp\/race_bug\.c/
    },
    {
        id: 'omp-4.2-demonstrar', etapa: 4, subpasso: 2,
        titulo: 'Vendo o bug acontecer',
        narracao: `
            <p>Compila e roda várias vezes — repara que o resultado muda a cada execução (não-determinístico):</p>
            <pre><code>gcc -fopenmp race_bug.c -o race_bug
./race_bug
./race_bug
./race_bug</code></pre>
            <p>Cada vez que rodar, o contador final é diferente. Isso é o <strong>sintoma</strong> de race condition. Num projeto real como palm vein, isso significa que seu EER muda entre execuções sem nenhuma mudança no modelo ou dados. Muito perigoso.</p>
            <p>Compila:</p>
            <pre><code>gcc -fopenmp race_bug.c -o race_bug</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^gcc\s+-fopenmp\s+race_bug/
    },

    // ========== ETAPA 5: Reduction ==========
    {
        id: 'omp-5.1-fix', etapa: 5, subpasso: 1,
        titulo: 'A cura: reduction(+:variavel)',
        narracao: `
            <p>O OpenMP tem uma solução elegante pro problema: a cláusula <code>reduction</code>. Ela diz ao compilador: "cada thread vai ter sua própria cópia privada dessa variável, e no final do loop todas as cópias são combinadas com a operação indicada".</p>
            <pre><code>#pragma omp parallel for reduction(+:true_positives) reduction(+:false_positives)
for (int i = 0; i < N; i++) {
    float score = compare(probe[i], gallery[i]);
    if (score > threshold) {
        if (is_genuine[i])
            true_positives++;   // ✅ Cada thread soma no SEU contador privado
        else
            false_positives++;  // ✅ No final, soma tudo automaticamente
    }
}</code></pre>
            <p>Resultado: determinístico, correto, rápido. Sem locks, sem atomic, sem complicação.</p>
            <p>Veja a versão corrigida:</p>
            <pre><code>cat openmp/race_fixed.c</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+openmp\/race_fixed\.c/
    },
    {
        id: 'omp-5.2-testar', etapa: 5, subpasso: 2,
        titulo: 'Agora o resultado é consistente',
        narracao: `
            <p>Compila e roda várias vezes — agora o resultado é <strong>sempre o mesmo</strong>:</p>
            <pre><code>gcc -fopenmp race_fixed.c -o race_fixed
./race_fixed
./race_fixed
./race_fixed</code></pre>
            <p>Sempre o mesmo número. Isso é <strong>determinismo</strong> — o que a gente quer num cálculo científico. Compila:</p>
            <pre><code>gcc -fopenmp race_fixed.c -o race_fixed</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^gcc\s+-fopenmp\s+race_fixed/
    },

    // ========== ETAPA 6: Sincronização ==========
    {
        id: 'omp-6.1-critical', etapa: 6, subpasso: 1,
        titulo: 'critical e atomic: quando reduction não basta',
        narracao: `
            <p>Reduction funciona pra operações simples (+, -, *, max, min). Mas e quando você precisa proteger uma operação mais complexa? Ex: atualizar uma lista ordenada de melhores matches:</p>
            <pre><code>// Manter os top-10 melhores matches do palm vein
Match top10[10];

#pragma omp parallel for
for (int i = 0; i < N; i++) {
    Match m = compute_match(probe, gallery[i]);

    #pragma omp critical
    {
        // Só 1 thread por vez entra aqui
        insert_if_better(top10, m);
    }
}</code></pre>
            <p><code>#pragma omp critical</code> = "só uma thread pode executar este bloco de cada vez". As outras esperam na fila. É um <strong>mutex</strong> (exclusão mútua).</p>
            <p>Pra operações simples (incrementar um contador), <code>#pragma omp atomic</code> é mais leve:</p>
            <pre><code>#pragma omp atomic
counter++;</code></pre>
            <p><code>atomic</code> usa instruções de hardware (lock-free), muito mais rápido que <code>critical</code>.</p>
        `
    },

    // ========== ETAPA 7: OpenMP no SDumont ==========
    {
        id: 'omp-7.1-cpus-per-task', etapa: 7, subpasso: 1,
        titulo: 'No SDumont: --cpus-per-task = threads OpenMP',
        narracao: `
            <p>Agora o link direto com o SDumont. Quando você submete um job com:</p>
            <pre><code>#SBATCH --cpus-per-task=16</code></pre>
            <p>Você está dizendo ao SLURM: "dá 16 cores pra este processo". O OpenMP pega esses 16 cores e cria 16 threads automaticamente (via <code>OMP_NUM_THREADS</code>, que o SLURM seta pra você).</p>
            <p>Lembra dos <strong>2 sockets × 24 cores</strong> por nó? Se você pedir 16 cores, o SLURM pode alocar:</p>
            <ul>
                <li>16 cores no <strong>mesmo socket</strong> → melhor performance (memória L3 compartilhada)</li>
                <li>8 cores em cada socket → mais lento (tráfego entre sockets)</li>
            </ul>
            <p>Veja o job script de OpenMP pro pré-processamento palm vein:</p>
            <pre><code>cat openmp/openmp_job.srm</code></pre>
        `,
        destaque: '#terminal',
        esperaComando: /^cat\s+openmp\/openmp_job\.srm/
    },
    {
        id: 'omp-7.2-submeter', etapa: 7, subpasso: 2,
        titulo: 'Submetendo o job OpenMP no SDumont',
        narracao: `
            <p>O job script que você acabou de ver usa 16 cores num único nó. Submete agora pra ver rodando:</p>
            <pre><code>sbatch openmp/openmp_job.srm</code></pre>
            <p>Olha a fila à direita — seu job OpenMP aparece na partição <code>sequana_cpu</code> (CPU puro, sem GPU). Depois que começar a rodar, o nó alocado vai ficar amarelo (parcialmente ocupado) porque você está usando 16 de 48 cores.</p>
        `,
        destaque: '#terminal',
        esperaComando: /^sbatch\s+openmp\/openmp_job\.srm/
    },

    // ========== ETAPA 8: Speedup e Amdahl ==========
    {
        id: 'omp-8.1-speedup', etapa: 8, subpasso: 1,
        titulo: 'Medindo o speedup real',
        narracao: `
            <p>Rodamos o pré-processamento de 16.800 imagens palm vein com diferentes números de threads:</p>
            <pre><code>Threads  Tempo (s)  Speedup  Eficiência
  1       33.60      1.0×     100%
  2       17.10      1.97×    98%
  4        8.72      3.85×    96%
  8        4.51      7.45×    93%
  16       2.38     14.12×    88%
  24       1.72     19.53×    81%
  48       1.15     29.22×    61%</code></pre>
            <p>Repare que com 48 threads o speedup é <strong>29×, não 48×</strong>. A eficiência cai de 100% pra 61%. Por quê?</p>
        `
    },
    {
        id: 'omp-8.2-amdahl', etapa: 8, subpasso: 2,
        titulo: 'Lei de Amdahl: o limite do paralelismo',
        narracao: `
            <p>A <strong>Lei de Amdahl</strong> explica isso: o speedup máximo é limitado pela <strong>parte sequencial</strong> do programa. Se 5% do código não pode ser paralelizado (I/O, inicialização, resultado final), mesmo com infinitas threads o speedup máximo é 1/0.05 = <strong>20×</strong>.</p>
            <p><strong>Fórmula:</strong> S(n) = 1 / (f + (1-f)/n)</p>
            <p>Onde <code>f</code> = fração sequencial, <code>n</code> = número de threads.</p>
            <p>Pra palm vein: a parte de ler imagens do disco e escrever resultados é sequencial. Quanto mais threads, mais essa parte domina.</p>
            <p><strong>Conclusão prática:</strong> não adianta pedir <code>--cpus-per-task=48</code> se seu código paralela só 90% do trabalho. Pedir 16-24 pode ser o ponto ótimo de custo/benefício (lembra que cada core-hora = 1 UA no SDumont).</p>
        `
    },
    {
        id: 'omp-8.3-fim', etapa: 8, subpasso: 3,
        titulo: 'Resumo: OpenMP na prática',
        narracao: `
            <p>O que você aprendeu neste módulo:</p>
            <ul>
                <li>✅ <strong>OpenMP</strong> paraleliza loops em C/C++ com uma linha: <code>#pragma omp parallel for</code></li>
                <li>✅ <strong>Threads</strong> compartilham memória — rápido mas perigoso (race conditions)</li>
                <li>✅ <strong>reduction</strong> resolve o problema mais comum (somar/contar em paralelo)</li>
                <li>✅ <strong>critical</strong> e <strong>atomic</strong> protegem operações mais complexas</li>
                <li>✅ <strong>schedule(dynamic)</strong> distribui trabalho sob demanda (bom quando imagens têm tamanhos diferentes)</li>
                <li>✅ No SDumont, <code>--cpus-per-task=N</code> se conecta diretamente com <code>OMP_NUM_THREADS=N</code></li>
                <li>✅ <strong>Lei de Amdahl</strong> limita o ganho — pedir cores demais desperdiça UAs</li>
            </ul>
            <p>No <strong>próximo módulo (GPU/CUDA)</strong>, você vai ver como o mesmo conceito se aplica às 8 V100 do GDL — mas com milhares de threads ao invés de 48. 🚀</p>
        `
    }
];

// Helper functions (same interface as tour.js)
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
