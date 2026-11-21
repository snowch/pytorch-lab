import torch
from torch.utils.data import Dataset


class StandardizedRows(Dataset):
    def __init__(self, features, labels, center, scale):
        self.features = features
        self.labels = labels
        self.center = center
        self.scale = scale

    def __len__(self):
        return self.labels.numel()

    def __getitem__(self, index):
        return (self.features[index] - self.center) / self.scale, self.labels[index]


train_x = torch.tensor([[1., 8.], [2., 8.], [3., 8.]])
test_x = torch.tensor([[8., 8.], [9., 8.]])
center = train_x.mean(dim=0)
scale = train_x.std(dim=0, correction=0)
scale = torch.where(scale > 0, scale, 1.)
train = StandardizedRows(train_x, torch.tensor([0, 0, 1]), center, scale)
test = StandardizedRows(test_x, torch.tensor([1, 1]), center, scale)

train_rows = torch.stack([train[i][0] for i in range(len(train))])
test_rows = torch.stack([test[i][0] for i in range(len(test))])
print("training center:", center.tolist())
print("training scale:", scale.tolist())
print("train mean after scaling:", train_rows.mean(dim=0).tolist())
print("test mean after scaling:", test_rows.mean(dim=0).tolist())
torch.testing.assert_close(train_rows.mean(dim=0), torch.zeros(2))
assert test_rows[:, 0].mean().item() > 0
assert test_rows.isfinite().all()
