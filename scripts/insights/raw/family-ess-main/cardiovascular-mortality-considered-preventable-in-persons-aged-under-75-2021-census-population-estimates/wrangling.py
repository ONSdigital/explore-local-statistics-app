import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')

    df = df.replace({'Observation Status' : {'Value suppressed for disclosure control due to small count' : 'c'}})

    df['Period'] = df.apply(lambda x: f"gregorian-interval/{x['Period'][:4]}-01-01T00:00:00/P3Y" if '-' in x['Period'] else f"year/{x['Period']}", axis = 1)

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()