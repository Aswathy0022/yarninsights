import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.constants import FEATURE_COLUMNS, NUMERIC_COLUMNS
from app.ml.dataset import get_raw_dataset, label_dataframe_grades


class ModelRegistry:
    """Holds the trained pipelines + labeled dataset, attached to app.state at startup."""

    def __init__(self, reg_pipeline, clf_pipeline, df_labeled, r2_score: float, acc_score: float):
        self.reg_pipeline = reg_pipeline
        self.clf_pipeline = clf_pipeline
        self.df_labeled = df_labeled
        self.r2_score = r2_score
        self.acc_score = acc_score


def train_yarn_models() -> ModelRegistry:
    """Retrains both models from the CSV at process startup (BRD FR-7 — no persisted artifact)."""
    df_raw = get_raw_dataset()
    df_labeled = label_dataframe_grades(df_raw)

    sample_df = df_labeled.sample(8000, random_state=42)

    reg_features = [col for col in FEATURE_COLUMNS if col != "Tensile Strength of yarn (MPa)"]
    num_features_reg = [col for col in NUMERIC_COLUMNS if col != "Tensile Strength of yarn (MPa)"]

    X_reg = sample_df[reg_features]
    y_reg = sample_df["Tensile Strength of yarn (MPa)"]

    X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
        X_reg, y_reg, test_size=0.2, random_state=42
    )

    preprocessor_reg = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num_features_reg),
        ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("oh", OneHotEncoder(handle_unknown="ignore"))]), ["Dye Type"]),
    ])

    reg_pipeline = Pipeline([
        ("pre", preprocessor_reg),
        ("reg", RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
    ])
    reg_pipeline.fit(X_train_reg, y_train_reg)

    y_pred_reg = reg_pipeline.predict(X_test_reg)
    r2_score = float(np.corrcoef(y_test_reg, y_pred_reg)[0, 1] ** 2)

    X_clf = sample_df[FEATURE_COLUMNS]
    y_clf = sample_df["Quality Grade"]

    X_train_clf, X_test_clf, y_train_clf, y_test_clf = train_test_split(
        X_clf, y_clf, test_size=0.2, random_state=42, stratify=y_clf
    )

    preprocessor_clf = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), NUMERIC_COLUMNS),
        ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("oh", OneHotEncoder(handle_unknown="ignore"))]), ["Dye Type"]),
    ])

    clf_pipeline = Pipeline([
        ("pre", preprocessor_clf),
        ("clf", RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1)),
    ])
    clf_pipeline.fit(X_train_clf, y_train_clf)

    acc_score = float(clf_pipeline.score(X_test_clf, y_test_clf))

    return ModelRegistry(reg_pipeline, clf_pipeline, df_labeled, r2_score, acc_score)
