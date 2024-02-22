import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./healthy-life-expectancy.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None: # type: ignore
    df = pd.read_csv(input, na_values = 'na')

    df['observation_status'] = df.apply(lambda x: 'x' if ('na' in str(x['observation'])) else x['observation_status'], axis = 1)

    df['period'] = df.apply(lambda x: str(x['period'])[:4] + '-01-01T00:00:00/P3Y', axis = 1)

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()