import json

import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

torch.manual_seed(42)
# Independent, reproducible synthetic samples with a nonlinear boundary.
generator = torch.Generator().manual_seed(24)
features = torch.rand(320, 2, generator=generator) * 2 - 1
labels = (features[:, 0] * features[:, 1] > 0).long()
train_x, test_x = features[:256], features[256:]
train_y, test_y = labels[:256], labels[256:]

loader = DataLoader(TensorDataset(train_x, train_y), batch_size=32, shuffle=True,
                    generator=torch.Generator().manual_seed(19), num_workers=0)
model = nn.Sequential(nn.Linear(2, 16), nn.Tanh(), nn.Linear(16, 2))
optimizer = torch.optim.Adam(model.parameters(), lr=0.04)
criterion = nn.CrossEntropyLoss()

training_loss = []
for _ in range(20):
    model.train()
    total = 0.0
    for batch, target in loader:
        optimizer.zero_grad(set_to_none=True)
        loss = criterion(model(batch), target)
        loss.backward()
        optimizer.step()
        total += loss.item() * target.numel()
    training_loss.append(total / len(train_y))

model.eval()
with torch.inference_mode():
    predictions = model(test_x).argmax(dim=-1)
    accuracy = (predictions == test_y).float().mean().item()
    baseline = (test_y == train_y.bincount().argmax()).float().mean().item()
    confusion = torch.bincount(2 * test_y + predictions, minlength=4).reshape(2, 2)
print("held-out accuracy:", round(accuracy, 3), "| majority baseline:", round(baseline, 3))
print("confusion, rows true and columns predicted:", confusion.tolist())
print("LAB_CURVE " + json.dumps([{"label": "Training loss", "values": training_loss}]))

assert confusion.sum().item() == len(test_y)
assert accuracy > baseline + 0.15
