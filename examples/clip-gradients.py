import torch
from torch import nn

w = nn.Parameter(torch.tensor([3., 4.]))
optimizer = torch.optim.SGD([w], lr=0.1)
optimizer.zero_grad(set_to_none=True)
loss = w.square().sum()
loss.backward()
unclipped = w.grad.clone()
old_norm = nn.utils.clip_grad_norm_([w], max_norm=2.0, error_if_nonfinite=True)
clipped = w.grad.clone()
optimizer.step()

print("before clipping:", unclipped.tolist())
print("original norm:", old_norm.item())
print("after clipping:", clipped.tolist())
print("updated parameters:", w.detach().tolist())
torch.testing.assert_close(old_norm, torch.tensor(10.))
torch.testing.assert_close(clipped, torch.tensor([1.2, 1.6]))
torch.testing.assert_close(w, torch.tensor([2.88, 3.84]))
