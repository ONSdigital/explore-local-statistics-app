import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    
    df = pd.read_csv(input, na_values = 'na')

    df_cycle = df[["areacd","areanm","geography","period","cycle_to_work", "cycle_lower_confidence_interval_95","cycle_upper_confidence_interval_95","cycle_observation_status"]].rename(columns ={"cycle_to_work":"value","cycle_lower_confidence_interval_95":"lower_confidence_interval_95","cycle_upper_confidence_interval_95":"upper_confidence_interval_95","cycle_observation_status":"observation_status"})
    df_cycle["mode-of-travel"]="cycling"

    df_drive = df[["areacd","areanm","geography","period","drive_to_work","drive_lower_confidence_interval_95","drive_upper_confidence_interval_95","drive_observation_status"]].rename(columns ={"drive_to_work":"value","drive_lower_confidence_interval_95":"lower_confidence_interval_95","drive_upper_confidence_interval_95":"upper_confidence_interval_95","drive_observation_status":"observation_status"})

    df_drive["mode-of-travel"]="driving"

    df_public = df[["areacd","areanm","geography","period","public_transport_or_walk_to_work", "public_transport_or_walk_lower_confidence_interval_95","public_transport_or_walk_upper_confidence_interval_95","public_transport_observation_status"]].rename(columns ={"public_transport_or_walk_to_work":"value","public_transport_or_walk_lower_confidence_interval_95":"lower_confidence_interval_95","public_transport_or_walk_upper_confidence_interval_95":"upper_confidence_interval_95","public_transport_observation_status":"observation_status"})

    df_public["mode-of-travel"]="public transport or walking"

    df_average_travel = pd.concat([df_cycle,df_drive,df_public])

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()
