import torch
from torch import nn

image = torch.tensor([[[[0., 0., 1., 1.],
                        [0., 0., 1., 1.],
                        [0., 0., 1., 1.]]]])
edge = nn.Conv2d(1, 1, kernel_size=(1, 2), bias=False)
with torch.no_grad():
    edge.weight.copy_(torch.tensor([[[[-1., 1.]]]]))
    result = edge(image)

print("input NCHW:", tuple(image.shape))
print("response NCHW:", tuple(result.shape))
print(result[0, 0].tolist())
torch.testing.assert_close(result[0, 0], torch.tensor([[0., 1., 0.]]).expand(3, 3))
