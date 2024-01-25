import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')

    df['Period'] = df.apply(lambda x: str(x['Period'])[:4] + '-04-01T00:00:00/P' + str(int(str(x['Period'])[4:6]) - int(str(x['Period'])[2:4])) +'Y', axis = 1)

    df['Observation Status'] = df.apply(lambda x: 'c' if 'small population size' in str(x['Observation Status']) else x['Observation Status'], axis = 1 )

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()