// data/initial-fs.js
// Initial FS tree for SDumont 2nd. $HOME == $SCRATCH == /scratch/palmvein/unseen.

const TRAIN_SRM = `#!/bin/bash
#SBATCH --job-name=palmvein-train
#SBATCH -p lncc-h100_shared
#SBATCH --account=palmvein
#SBATCH --nodes=1
#SBATCH --gpus=2
#SBATCH --cpus-per-gpu=24
#SBATCH --time=12:00:00
#SBATCH --output=slurm-%j.out

# SDumont 2nd — palm vein biometrics training job.

echo "Job running on: $SLURM_JOB_NODELIST"
nodeset -e $SLURM_JOB_NODELIST

cd $SLURM_SUBMIT_DIR

module load arch_gpu/current
module load anaconda3/2024.02
source activate $SCRATCH/envs/palmvein

srun torchrun --nproc_per_node=2 \\
    code/train.py \\
    --data $SCRATCH/datasets/palm_vein \\
    --checkpoints $SCRATCH/checkpoints \\
    --epochs 50 \\
    --batch-size 128
`;

const README_MD = `# Palm Vein Biometrics

Biometria de veias palmares para autenticação via rede neural siamesa.

## Dataset
~16.800 imagens infravermelhas, 80/10/10 train/val/test.

## Arquitetura
SiameseCNN com triplet loss, backbone ResNet-50 fine-tuned.

## Métricas
- EER (Equal Error Rate) — meta < 5%
- FAR, FRR @ threshold calibrado

## Rodar no SDumont
Ver train_palmvein.srm e envs_readme.md.
`;

const TRAIN_PY = `#!/usr/bin/env python
"""train.py — Palm vein biometrics training loop (distributed)."""
import argparse
import os
import time
import torch
from torch.utils.data import DataLoader
from torch.nn.parallel import DistributedDataParallel as DDP

from model import SiameseCNN, triplet_loss
from dataset import PalmVeinTripletDataset

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data', required=True)
    p.add_argument('--checkpoints', required=True)
    p.add_argument('--epochs', type=int, default=50)
    p.add_argument('--batch-size', type=int, default=128)
    p.add_argument('--lr', type=float, default=1e-4)
    p.add_argument('--margin', type=float, default=0.3)
    return p.parse_args()

def main():
    args = parse_args()
    rank = int(os.environ.get('LOCAL_RANK', 0))
    world_size = int(os.environ.get('WORLD_SIZE', 1))
    if world_size > 1:
        torch.distributed.init_process_group('nccl')
        torch.cuda.set_device(rank)
    device = torch.device(f'cuda:{rank}')
    print(f'[rank {rank}/{world_size}] device={device}', flush=True)

    ds = PalmVeinTripletDataset(args.data, split='train')
    sampler = torch.utils.data.distributed.DistributedSampler(ds) if world_size > 1 else None
    loader = DataLoader(ds, batch_size=args.batch_size, sampler=sampler, num_workers=4, pin_memory=True)

    model = SiameseCNN(embedding_dim=256).to(device)
    if world_size > 1:
        model = DDP(model, device_ids=[rank])
    optim = torch.optim.Adam(model.parameters(), lr=args.lr)

    for epoch in range(args.epochs):
        if sampler: sampler.set_epoch(epoch)
        model.train()
        t0 = time.time()
        total = 0.0
        for a, p, n in loader:
            a, p, n = a.to(device), p.to(device), n.to(device)
            loss = triplet_loss(model(a), model(p), model(n), margin=args.margin)
            optim.zero_grad(); loss.backward(); optim.step()
            total += loss.item()
        if rank == 0:
            avg = total / len(loader)
            print(f'[epoch {epoch+1}/{args.epochs}] loss={avg:.4f} time={time.time()-t0:.0f}s', flush=True)
            torch.save(model.state_dict(), os.path.join(args.checkpoints, f'epoch_{epoch+1:02d}.pt'))

if __name__ == '__main__':
    main()
`;

const MODEL_PY = `"""model.py — Siamese CNN for palm vein matching."""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import resnet50

class SiameseCNN(nn.Module):
    def __init__(self, embedding_dim=256):
        super().__init__()
        backbone = resnet50(weights='IMAGENET1K_V2')
        in_features = backbone.fc.in_features
        backbone.fc = nn.Identity()
        self.backbone = backbone
        self.embed = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, embedding_dim)
        )
    def forward(self, x):
        return F.normalize(self.embed(self.backbone(x)), p=2, dim=1)

def triplet_loss(a, p, n, margin=0.3):
    d_pos = (a - p).pow(2).sum(dim=1)
    d_neg = (a - n).pow(2).sum(dim=1)
    return F.relu(d_pos - d_neg + margin).mean()
`;

const DATASET_PY = `"""dataset.py — Palm vein triplet dataset loader."""
import os
import random
import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image

class PalmVeinTripletDataset(Dataset):
    def __init__(self, root, split='train', img_size=224):
        self.root = os.path.join(root, split)
        self.subjects = sorted(os.listdir(self.root))
        self.samples = {s: sorted(os.listdir(os.path.join(self.root, s))) for s in self.subjects}
        self.transform = transforms.Compose([
            transforms.Grayscale(num_output_channels=3),
            transforms.Resize((img_size, img_size)),
            transforms.RandomHorizontalFlip(0.3),
            transforms.ToTensor(),
            transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
        ])
    def __len__(self):
        return sum(len(v) for v in self.samples.values())
    def __getitem__(self, idx):
        a_sub = random.choice(self.subjects)
        n_sub = random.choice([s for s in self.subjects if s != a_sub])
        a_img, p_img = random.sample(self.samples[a_sub], 2)
        n_img = random.choice(self.samples[n_sub])
        load = lambda s, f: self.transform(Image.open(os.path.join(self.root, s, f)))
        return load(a_sub, a_img), load(a_sub, p_img), load(n_sub, n_img)
`;

const REQUIREMENTS_TXT = `torch>=2.0
torchvision>=0.15
numpy
pillow
opencv-python
albumentations
scikit-learn
tqdm
`;

const ENVS_README = `# Como criar o conda env no SDumont 2nd

**No 2nd:** $HOME == $SCRATCH (ambos em Lustre), visíveis em todos os nós.

\`\`\`bash
module load arch_gpu/current
module load anaconda3/2024.02
conda create --prefix $SCRATCH/envs/palmvein python=3.11 -y
source activate $SCRATCH/envs/palmvein
pip install -r $HOME/code/requirements.txt
\`\`\`

**Regra crítica:** NÃO deixe o conda env ativo quando rodar \`sbatch\`.
O module load + source activate ficam DENTRO do job script.
`;

const DATASET_README = `Palm vein IR images
~16800 total, 80/10/10 split
Capturado internamente + CASIA-MS-PalmprintV1
`;

// SDumont 2nd: $HOME == $SCRATCH == /scratch/<PROJETO>/<user>
// Everything in Lustre, visible on all nodes.
export const INITIAL_FS = {
    '/': {
        type: 'dir', visibility: 'all', children: {
            'scratch': {
                type: 'dir', visibility: 'all', children: {
                    'palmvein': {
                        type: 'dir', visibility: 'all', children: {
                            'unseen': {
                                type: 'dir', visibility: 'all', children: {
                                    'README.md': { type: 'file', visibility: 'all', content: README_MD },
                                    'code': {
                                        type: 'dir', visibility: 'all', children: {
                                            'train.py':        { type: 'file', visibility: 'all', content: TRAIN_PY },
                                            'model.py':        { type: 'file', visibility: 'all', content: MODEL_PY },
                                            'dataset.py':      { type: 'file', visibility: 'all', content: DATASET_PY },
                                            'requirements.txt':{ type: 'file', visibility: 'all', content: REQUIREMENTS_TXT }
                                        }
                                    },
                                    'train_palmvein.srm': { type: 'file', visibility: 'all', content: TRAIN_SRM },
                                    'envs_readme.md':     { type: 'file', visibility: 'all', content: ENVS_README },
                                    'datasets': {
                                        type: 'dir', visibility: 'all', children: {
                                            'palm_vein': {
                                                type: 'dir', visibility: 'all', children: {
                                                    'README.txt': { type: 'file', visibility: 'all', content: DATASET_README }
                                                }
                                            }
                                        }
                                    },
                                    'envs': {
                                        type: 'dir', visibility: 'all', children: {
                                            'palmvein': { type: 'dir', visibility: 'all', children: {} }
                                        }
                                    },
                                    'checkpoints': { type: 'dir', visibility: 'all', children: {} },
                                    'runs':        { type: 'dir', visibility: 'all', children: {} }
                                }
                            }
                        }
                    }
                }
            },
            'home': {
                type: 'dir', visibility: 'all', children: {
                    'pedro': { type: 'dir', visibility: 'all', children: {} }
                }
            },
            'tmp': { type: 'dir', visibility: 'all', children: {} }
        }
    }
};
