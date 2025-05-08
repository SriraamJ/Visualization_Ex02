from flask import Flask, render_template
import pandas as pd
import json
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

app = Flask(__name__)

# Ensure that we can reload when we change the HTML / JS for debugging
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True

# List of countries to filter
COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia', 'Australia',
    'Austria', 'Azerbaijan', 'Brazil', 'Bulgaria', 'Cameroon', 'Chile', 'China', 'Colombia',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Ecuador', 'Egypt, Arab Rep.', 'Eritrea',
    'Ethiopia', 'France', 'Germany', 'Ghana', 'Greece', 'India', 'Indonesia', 'Iran, Islamic Rep.',
    'Iraq', 'Ireland', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Lebanon', 'Malta',
    'Mexico', 'Morocco', 'Pakistan', 'Peru', 'Philippines', 'Russian Federation',
    'Syrian Arab Republic', 'Tunisia', 'Turkey', 'Ukraine', 'Zimbabwe'
]

@app.route('/')
def data():
    # Load the CSV file
    df = pd.read_csv('agriRuralDevelopment_cleaned.csv')
    
    # Filter the dataframe to include only the specified countries
    filtered_df = df[df['Country Name'].isin(COUNTRIES)]
    
    # Convert the filtered data to JSON format for the client
    data_json = filtered_df.to_json(orient='records')
    
    # Extract the most recent year (2020)
    latest_year_df = filtered_df[filtered_df['year'] == 2020]
    
    # Select numerical columns for PCA (excluding 'Country Name', 'Country Code', and 'year')
    numeric_columns = [col for col in latest_year_df.columns if col not in ['Country Name', 'Country Code', 'year']]
    pca_data = latest_year_df[numeric_columns].select_dtypes(include=['float64', 'int64']).values
    
    # Scale the features
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(pca_data)
    
    # Perform PCA to reduce to 2 components
    pca = PCA(n_components=2)
    pca_result = pca.fit_transform(scaled_data)
    
    # Combine PCA results with country names
    pca_df = pd.DataFrame({
        'Country Name': latest_year_df['Country Name'],
        'PCA1': pca_result[:, 0],
        'PCA2': pca_result[:, 1]
    })
    
    # Convert PCA results to JSON
    pca_json = pca_df.to_json(orient='records')
    
    # Get list of indicators (numeric columns) for the dropdown
    indicators = numeric_columns
    
    # Return the index file with data, PCA results, and indicators
    return render_template('index.html', data=json.loads(data_json), pca_data=json.loads(pca_json), indicators=indicators)

if __name__ == '__main__':
    app.run(debug=True)