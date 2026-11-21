import torch
from torch import nn


class Classifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Linear(3, 5)
        self.head = nn.Linear(5, 2)

    def forward(self, inputs):
        hidden = self.features(inputs).relu()
        return self.head(hidden)


torch.manual_seed(7)
model = Classifier()
features = torch.ones(4, 3)
logits = model(features)
for name, parameter in model.named_parameters():
    print(name, tuple(parameter.shape))
print("logit shape:", tuple(logits.shape))
print("trainable parameters:", sum(p.numel() for p in model.parameters()))

assert logits.shape == (4, 2)
assert sum(p.numel() for p in model.parameters()) == 32
