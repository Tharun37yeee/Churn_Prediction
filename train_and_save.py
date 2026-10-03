import joblib 
import pandas as pd
import numpy as np
import catboost as cb
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

data = pd.read_csv(r'C:\Users\Tharun37\OneDrive\Desktop\Churn Predict\telco.csv')

categorical_cols = [
    'gender', 'Partner', 'Dependents', 'PhoneService', 'MultipleLines',
    'InternetService', 'OnlineSecurity', 'OnlineBackup', 'DeviceProtection',
    'TechSupport', 'StreamingTV', 'StreamingMovies', 'Contract',
    'PaperlessBilling', 'PaymentMethod']

target_encoder = LabelEncoder()
y = target_encoder.fit_transform(data['Churn'])

x = pd.DataFrame()
feature_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    x[col] = le.fit_transform(data[col].astype(str))
    feature_encoders[col] = le

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size = 0.20, random_state = 42, stratify=y)

imbalance_ratio = np.sum(y_train == 0) / np.sum(y_train == 1)

lgb_model = lgb.LGBMClassifier(n_estimators = 300,
                               learning_rate = 0.5,
                               num_leaves = 31,
                               max_depth = 5,
                               scale_pos_weight = imbalance_ratio,
                               random_state = 42,
                               verbosity = 1)
lgb_model.fit(x_train, y_train, eval_set = [(x_test, y_test)],
              eval_metric = "binary_logloss",
              callbacks = [
                  lgb.early_stopping(stopping_rounds = 20, verbose = False),
                  lgb.log_evaluation(period = 0)
              ])

cat_model = cb.CatBoostClassifier(
    iterations = 300,
    learning_rate = 0.05,
    depth = 5,
    auto_class_weights = "Balanced",
    eval_metric = "Logloss",
    random_seed = 42,
    verbose = False
)
cat_model.fit(x_train, y_train, eval_set = [(x_test, y_test)],
              early_stopping_rounds = 20,verbose = False )

lgb_model.booster_.save_model('lgbm_churn_model.txt')
cat_model.save_model('catboost_churn_model.cbm')

pipeline_metadata = {
    'categorical_cols' : categorical_cols,
    'feature_encoders' : feature_encoders,
    'target_encoder' : target_encoder,
    'decision_threshold' : 0.52
}
joblib.dump(pipeline_metadata, 'churn_pipeline_metadata.joblib')

print("Deployment artifacts saved successfully:")
print(" - lgbm_churn_model.txt")
print(" - catboost_churn_model.cbm")
print(" - churn_pipeline_metadata.joblib")