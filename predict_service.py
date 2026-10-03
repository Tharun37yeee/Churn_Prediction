import joblib
import numpy as np
import pandas as pd
import lightgbm as lgb
import catboost as cb

class ChurnPredictor:
    def __init__(self, metadata_path = 'churn_pipeline_metadata.joblib',
                 lgb_path = 'lgbm_churn_model.txt',
                 cat_path = 'catboost_churn_model.cbm'):

        meta = joblib.load(metadata_path)
        self.categorical_cols = meta['categorical_cols']
        self.feature_encoders = meta['feature_encoders']
        self.threshold = meta['decision_threshold']

        self.lgb_booster = lgb.Booster(model_file = lgb_path)
        self.cat_booster = cb.CatBoostClassifier()
        self.cat_booster.load_model(cat_path)

    def preprocess(self, input_df: pd.DataFrame) -> pd.DataFrame:
        """Transforms categorical data to numerical using saved LabelEncoders"""
        processed_df = pd.DataFrame()
        for col in self.categorical_cols:
            le = self.feature_encoders[col]
            val_series = input_df[col].astype(str)
            valid_categories = set(le.classes_)
            val_series = val_series.apply(lambda x: x if x in valid_categories else le.classes_[0])
            processed_df[col] = le.transform(val_series)

        return processed_df

    def predict(self, raw_df: pd.DataFrame):
        """Generates ensemble probability, binary churn flag and risk category"""
        X_proc = self.preprocess(raw_df)
        p_lgb = self.lgb_booster.predict(X_proc)
        p_cat = self.cat_booster.predict_proba(X_proc)[:, 1]

        blend_probs = (p_lgb + p_cat)/ 2.0
        predictions = (blend_probs >= self.threshold).astype(int)

        return pd.DataFrame({
            'churn_probability' : np.round(blend_probs, 4),
            'will_churn' : predictions,
            'risk_level' : pd.cut(
                blend_probs,
                bins = [-0.01, 0.35, 0.60, 1.00],
                labels = ['Low', 'Medium', 'High']
            )
        })

if __name__ == '__main__':
    predictor = ChurnPredictor()

    sample_customers = pd.DataFrame([{
        'gender': 'Female',
        'Partner': 'Yes',
        'Dependents': 'No',
        'PhoneService': 'No',
        'MultipleLines': 'No phone service',
        'InternetService': 'DSL',
        'OnlineSecurity': 'No',
        'OnlineBackup': 'Yes',
        'DeviceProtection': 'No',
        'TechSupport': 'No',
        'StreamingTV': 'No',
        'StreamingMovies': 'No',
        'Contract': 'Month-to-month',
        'PaperlessBilling': 'Yes',
        'PaymentMethod': 'Electronic check'
    }])

    results = predictor.predict(sample_customers)
    print(results)