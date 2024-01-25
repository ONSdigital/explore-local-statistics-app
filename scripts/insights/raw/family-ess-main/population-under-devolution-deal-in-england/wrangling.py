import click
import pandas as pd
from pathlib import Path
from time import strptime


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')

    df['Period'] = df.apply(lambda x: x['Period'].split()[4] + '-' + ('00'+str(strptime(str(x['Period'].split()[3])[:3],'%b').tm_mon))[-2:] + '-' + x['Period'].split()[2] + 'T00:00:00', axis = 1)

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()