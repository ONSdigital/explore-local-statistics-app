import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))

def wrangle(input: Path()) -> None:

    df = pd.read_csv(input)

    # Setup columns to use as indicators
    df["employment"], df["inactivity"] = ["Employment Rate","Economic Inactivity Rate"]

    # Concatenate wide dataframe to long format, using above indicator columns to keep track of value sources
    df = pd.concat(
    [
        df.loc[
            :,
            [
                "areacd",
                "areanm",
                "geography",
                "period",
                "unit",
                "employment",
                "employment_rate",
                "employment_rate_measure",
                "employment_rate_numerator",
                "employment_rate_denominator",
                "employment_rate_lower_confidence_interval_95",
                "employment_rate_upper_confidence_interval_95",
                "employment_rate_observation_status",
            ],
        ].rename(
            columns={
                "employment": "indicator",
                "employment_rate": "observation",
                "employment_rate_measure": "measure",
                "employment_rate_numerator": "numerator",
                "employment_rate_denominator": "denominator",
                "employment_rate_lower_confidence_interval_95": "lower_confidence_interval_95",
                "employment_rate_upper_confidence_interval_95": "upper_confidence_interval_95",
                "employment_rate_observation_status": "observation_status",
            }
        ),
    
        df.loc[
            :,
            [
                "areacd",
                "areanm",
                "geography",
                "period",
                "unit",
                "inactivity",
                "economically_inactive",
                "economically_inactive_measure",
                "economically_inactive_numerator",
                "economically_inactive_denominator",
                "economically_inactive_lower_confidence_interval_95",
                "economically_inactive_upper_confidence_interval_95",
                "economically_inactive_observation_status",
            ],
        ].rename(
            columns={
                "inactivity": "indicator",
                "economically_inactive": "observation",
                "economically_inactive_measure": "measure",
                "economically_inactive_numerator": "numerator",
                "economically_inactive_denominator": "denominator",
                "economically_inactive_lower_confidence_interval_95": "lower_confidence_interval_95",
                "economically_inactive_upper_confidence_interval_95": "upper_confidence_interval_95",
                "economically_inactive_observation_status": "observation_status",
            }
        ),
    ]
)

    # Specifying columns to keep
    df = df[
    [
        "areacd",
        "areanm",
        "geography",
        "period",
        "indicator",
        "observation",
        "unit",
        "measure",
        "numerator",
        "denominator",
        "lower_confidence_interval_95",
        "upper_confidence_interval_95",
        "observation_status",
    ]
]

    # Use the year from the gregorian interval provided
    #df.period = df.period.str[:4]

    # Replace 'na' values in dataframe with empty strings
    df.replace(r"^na$", "", regex=True, inplace=True)

    # Replace empty observation_status cells only if value cell is also empty
    # Not necessary if base csv has already been updated to fix this issue

    df['observation_status'] = df.apply(lambda x: 'x' if pd.isna(x.observation) else x['observation_status'], axis = 1 )

    df['lower_confidence_interval_95'] = df['lower_confidence_interval_95'].astype(float).round(2)
    df['upper_confidence_interval_95'] = df['upper_confidence_interval_95'].astype(float).round(2)

    df.to_csv("employment-rate-long.csv", index=False)
    
if __name__ == "__main__":

    wrangle()
    
