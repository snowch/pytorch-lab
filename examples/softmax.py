import torch

logits = torch.tensor([[1000., 1001., 1002.], [-1002., -1001., -1000.]])
naive = logits.exp()
naive = naive / naive.sum(dim=-1, keepdim=True)
shifted = (logits - logits.amax(dim=-1, keepdim=True)).exp()
stable = shifted / shifted.sum(dim=-1, keepdim=True)

print("naive:", naive.tolist())
print("stable:", stable.tolist())
print("row sums:", stable.sum(dim=-1).tolist())
assert not naive.isfinite().all()
torch.testing.assert_close(stable, logits.softmax(dim=-1))
