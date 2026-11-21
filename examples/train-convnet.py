import json

import torch
from torch import nn

torch.manual_seed(32)


def make_images(count, seed):
    generator = torch.Generator().manual_seed(seed)
    images = torch.randn(count, 1, 8, 8, generator=generator) * 0.2
    labels = torch.arange(count) % 2
    offsets = torch.randint(0, 6, (count,), generator=generator)
    for i, offset in enumerate(offsets.tolist()):
        if labels[i].item() == 0:
            images[i, 0, offset:offset + 3, :] += 1.0
        else:
            images[i, 0, :, offset:offset + 3] += 1.0
    return images, labels


images, labels = make_images(64, 1)
test_images, test_labels = make_images(24, 2)
model = nn.Sequential(nn.Conv2d(1, 8, kernel_size=3), nn.ReLU(),
                      nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(8, 2))
optimizer = torch.optim.Adam(model.parameters(), lr=0.05)
criterion = nn.CrossEntropyLoss()
history = []
for _ in range(20):
    optimizer.zero_grad(set_to_none=True)
    loss = criterion(model(images), labels)
    loss.backward()
    optimizer.step()
    history.append(loss.item())

model.eval()
with torch.inference_mode():
    test_predictions = model(test_images).argmax(dim=-1)
    accuracy = (test_predictions == test_labels).float().mean().item()
print("image shape:", tuple(test_images.shape), "| accuracy:", round(accuracy, 3))
print("LAB_CURVE " + json.dumps([{"label": "Training cross-entropy", "values": history}]))
assert history[-1] < history[0]
assert accuracy >= 0.85
