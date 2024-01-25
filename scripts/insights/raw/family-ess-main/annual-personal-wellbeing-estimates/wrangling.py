import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = "na")

    anxiety = df[["areacd", "areanm", "geography", "period", "anxiety", "anxiety_measure", "unit", "anxiety_lower_confidence_interval_95", "anxiety_upper_confidence_interval_95", "anxiety_observation_status"]]
    worthwhile = df[["areacd", "areanm", "geography", "period", "worthwhile", "worthwhile_measure", "unit", "worthwhile_lower_confidence_interval_95", "worthwhile_upper_confidence_interval_95", "worthwhile_observation_status"]]
    happiness = df[["areacd", "areanm", "geography", "period", "happiness", "happiness_measure", "unit", "happiness_lower_confidence_interval_95", "happiness_upper_confidence_interval_95", "happiness_observation_status"]]
    satisfaction = df[["areacd", "areanm", "geography", "period", "satisfaction", "satisfaction_measure", "unit", "satisfaction_lower_confidence_interval_95", "satisfaction_upper_confidence_interval_95", "satisfaction_observation_status"]]
    
    all_data = (anxiety, worthwhile, happiness, satisfaction)

    for df in all_data:
        df.columns = ["AREACD", "AREANM", "Geography", "Period", "Value", "Measure", "Unit", "Lower Confidence Interval (95%)", "Upper Confidence Interval (95%)", "Observation Status"]
    
    df = pd.concat(all_data, axis=0)

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()