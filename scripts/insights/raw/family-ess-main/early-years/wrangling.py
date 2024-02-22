import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))

def wrangle(input: Path()) -> None:

    df = pd.read_csv(input)

    # Setup columns to use as measures
    df["communication_measure"], df["literacy_measure"],df["math_measure"] = ["Communication and Language","Literacy","Mathematics"]

    #Add "unit" column as it was not in the csv file. There is no need to add "unit" column if it does exist in the csv file
    df['unit']="%"
    
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
                "communication_measure",
                "communication_and_language",
                "communication_lower_confidence_interval_95",
                "communication_upper_confidence_interval_95",
                "communication_observation_status",
            ],
        ].rename(
            columns={
                "communication_measure": "measure",
                "communication_and_language": "observation",
                "communication_lower_confidence_interval_95": "lower_confidence_interval_95",
                "communication_upper_confidence_interval_95": "upper_confidence_interval_95",
                "communication_observation_status": "observation_status",
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
                "literacy_measure",
                "literacy",
                "literacy_lower_confidence_interval_95",
                "literacy_upper_confidence_interval_95",
                "literacy_observation_status",
            ],
        ].rename(
            columns={
                "literacy_measure": "measure",
                "literacy": "observation",
                "literacy_lower_confidence_interval_95": "lower_confidence_interval_95",
                "literacy_upper_confidence_interval_95": "upper_confidence_interval_95",
                "literacy_observation_status": "observation_status",
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
                "math_measure",
                "mathematics",
                "mathematics_lower_confidence_interval_95",
                "mathematics_upper_confidence_interval_95",
                "mathematics_observation_status",
            ],
        ].rename(
            columns={
                "math_measure": "measure",
                "mathematics": "observation",
                "mathematics_lower_confidence_interval_95": "lower_confidence_interval_95",
                "mathematics_upper_confidence_interval_95": "upper_confidence_interval_95",
                "mathematics_observation_status": "observation_status",
            }
                )
        
    ]
    )


    # Specifying columns to keep
    df = df[
    [
        "areacd",
        "areanm",
        "geography",
        "period",
        "unit",
        "measure",
        "observation",
        "lower_confidence_interval_95",
        "upper_confidence_interval_95",
        "observation_status",
    ]
    ]

    

    # Replace 'na' values in dataframe with empty strings
    
    df.replace(r"^na$", "", regex=True, inplace=True)

    # Replace empty observation_status cells only if value cell is also empty
    # Not necessary if base csv has already been updated to fix this issue

    df['observation_status'] = df.apply(lambda x: 'x' if pd.isna(x.observation) else x['observation_status'], axis = 1 )

    df['lower_confidence_interval_95'] = df['lower_confidence_interval_95'].astype("Float64").round(2)
    df['upper_confidence_interval_95'] = df['upper_confidence_interval_95'].astype("Float64").round(2)
    #df = df.astype({"observation_status": str})

    df.to_csv("early-years.csv", index=False)
    
if __name__ == "__main__":

    wrangle()
    
