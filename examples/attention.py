import math

import torch
from torch.nn import functional as F

q = torch.tensor([[[[1., 0.], [0., 1.], [1., 1.]]]])
k = q.clone()
v = torch.tensor([[[[1., 0.], [0., 1.], [2., 2.]]]])
length = q.size(-2)
allowed = torch.ones(length, length, dtype=torch.bool).tril()
scores = (q @ k.transpose(-2, -1)) / math.sqrt(q.size(-1))
weights = scores.masked_fill(~allowed, float("-inf")).softmax(dim=-1)
manual = weights @ v
builtin = F.scaled_dot_product_attention(q, k, v, is_causal=True)

print("causal weights:", weights[0, 0].tolist())
print("output:", manual[0, 0].tolist())
torch.testing.assert_close(manual, builtin)
torch.testing.assert_close(manual[..., 0, :], v[..., 0, :])
