import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./apprenticeship.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None: # type: ignore
    
    df = pd.read_csv(input)
    #df = pd.read_csv(input, na_values = 'na')
    #df['observation_status'] = df.apply(lambda x: 'x' if 'na' in str(x['observation']) else x['observation_status'], axis = 1)

    #Transform from academic year to Gregorian date 

    df['period'] = df.apply(lambda x: str(x['period'])[:4] + '-09-01T00:00:00/P1Y', axis = 1)

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()