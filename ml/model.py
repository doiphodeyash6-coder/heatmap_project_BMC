import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import joblib

# load data
data = pd.read_csv("data.csv")

X = data.drop("label", axis=1)
y = data["label"
]

# split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# model
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# evaluate
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"✅ Accuracy: {acc:.2f}")

# save model
joblib.dump(model, "model.pkl")

print("✅ Model trained and saved to model.pkl")

