### This wrangling is used to transform from wide to long format

import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))

def wrangle(input: Path()) -> None:

    df = pd.read_csv(input)

    # Setup columns to use as indicators
    df["Employment"], df["Inactivity"] = ["Employment Rate","Economic Inactivity Rate"]

    # Concatenate wide dataframe to long format, using above indicator columns to keep track of value sources
    df = pd.concat(
    [
        df.loc[
            :,
            [
                "AREACD",
                "AREANM",
                "Geography",
                "Period",
                "Unit",
                "Employment",
                "Employment_Rate",
                "Employment_Rate_Lower_Confidence_Interval",
                "Employment_Rate_Upper_Confidence_Interval",
                "Employment_Rate_Numerator",
                "Employment_Rate_Total"
            ],
        ].rename(
            columns={
                "Employment": "Indicator",
                "Employment_Rate": "Observation",
                "Employment_Rate_Lower_Confidence_Interval": "Lower_confidence_interval_95",
                "Employment_Rate_Upper_Confidence_Interval": "Upper_confidence_interval_95",
                "Employment_Rate_Numerator": "Numerator",
                "Employment_Rate_Total": "Total",
            }
        ),
    
        df.loc[
            :,
            [
                "AREACD",
                "AREANM",
                "Geography",
                "Period",
                "Unit",
                "Inactivity",
                "Economic_Inactivity_Rate",
                "Economic_Inactivity_Rate_Lower_Confidence_Interval",
                "Economic_Inactivity_Rate_Upper_Confidence_Interval",
                "Economic_Inactivity_Numerator",
                "Economic_Inactivity_Total"
            ],
        ].rename(
            columns={
                "Inactivity":"Indicator",
                "Economic_Inactivity_Rate": "Observation",
                "Economic_Inactivity_Rate_Lower_Confidence_Interval": "Lower_confidence_interval_95",
                "Economic_Inactivity_Rate_Upper_Confidence_Interval": "Upper_confidence_interval_95",
                "Economic_Inactivity_Numerator": "Numerator",
                "Economic_Inactivity_Total":"Total"
            }
        ),
    ]
)

    # Specifying columns to keep
    df = df[
    [
        "AREACD",
        "AREANM",
        "Geography",
        "Period",
        "Unit",
        "Indicator",
        "Observation",
        "Lower_confidence_interval_95",
        "Upper_confidence_interval_95",
        "Numerator",
        "Total"
    ]
]

    # Use the year from the gregorian interval provided
    #df.period = df.period.str[:4]

    # Replace 'na' values in dataframe with empty strings
    df.replace(r"^na$", "", regex=True, inplace=True)

    # Replace empty observation_status cells only if value cell is also empty
    # Not necessary if base csv has already been updated to fix this issue

    df['Observation_status'] = df.apply(lambda x: 'x' if pd.isna(x.Observation) else '', axis = 1 )

    df['Lower_confidence_interval_95'] = df['Lower_confidence_interval_95'].astype(float).round(2)
    df['Upper_confidence_interval_95'] = df['Upper_confidence_interval_95'].astype(float).round(2)

    df.to_csv("ni-employment-rate.csv", index=False)
    
if __name__ == "__main__":

    wrangle()
    
