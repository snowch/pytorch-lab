import json

import torch

rates = [0.05, 0.5, 1.1]


def train(rate):
    p = torch.tensor(3., requires_grad=True)
    optimizer = torch.optim.SGD([p], lr=rate)
    history = []
    for _ in range(9):
        optimizer.zero_grad(set_to_none=True)
        loss = p.square()
        history.append(loss.item())
        loss.backward()
        optimizer.step()
    return history


series = [{"label": f"lr = {rate}", "values": train(rate)} for rate in rates]
for line in series:
    print(line["label"], "first and last:", line["values"][0], line["values"][-1])
print("LAB_CURVE " + json.dumps(series))
assert series[1]["values"][-1] == 0
assert series[2]["values"][-1] > series[2]["values"][0]
