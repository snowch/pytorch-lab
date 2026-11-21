import torch
from torch.utils.data import DataLoader, TensorDataset

features = torch.arange(18, dtype=torch.float32).reshape(9, 2)
labels = torch.arange(9) % 2
dataset = TensorDataset(features, labels)
generator = torch.Generator().manual_seed(17)
loader = DataLoader(dataset, batch_size=4, shuffle=True, generator=generator,
                    num_workers=0)
seen = []
sizes = []
for batch_x, batch_y in loader:
    ids = (batch_x[:, 0] / 2).int().tolist()
    print("batch ids:", ids, "labels:", batch_y.tolist())
    seen.extend(ids)
    sizes.append(len(ids))

assert sorted(seen) == list(range(9))
assert sizes == [4, 4, 1]
