import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')

    df['Period'] = df.apply(lambda x: x['Period'][:4] + '-20' + x['Period'][-2:], axis = 1)

    df['Observation Status'] = df.apply(lambda x: 'x' if 'na' in str(x['Value']) else x['Observation Status'], axis = 1 )
    # There are NA values without an observation stutus, I'm choosing to take them on face value as 'not-available'

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()