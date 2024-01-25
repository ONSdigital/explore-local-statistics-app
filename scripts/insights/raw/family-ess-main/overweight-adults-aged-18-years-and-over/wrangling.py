import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')
    df.drop(df[df['AREACD']=='E47000005'].index, inplace=True)

    df['Period'] = df.apply(lambda x: str(x['Period'])[6:10] + '-11-16T00:00:00/P1Y', axis = 1)

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()