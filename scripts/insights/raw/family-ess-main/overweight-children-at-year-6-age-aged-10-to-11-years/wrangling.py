import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')
    df.drop(df[df['AREACD']=='E47000005'].index, inplace=True)
    #df.loc[df['AREACD'] =='E47000005', 'AREACD'] = 'E47000010'

    df['Period'] = df.apply(lambda x: str(x['Period'])[:4] + '-08-01T00:00:00/P1Y', axis = 1)

    indexNames = df[ df['AREANM'].isna() ].index
    df.drop(indexNames, inplace = True)

    indexNames = df[ df['AREACD'].str.contains('Cl_') ].index
    df.drop(indexNames, inplace = True)

    df = df.replace({'Observation Status' : {'Value missing due to small sample size' : 'c',
                                            'Value missing in source data' : 'x',
                                            'Value not published for data quality reasons' : 'u',
                                            'Value suppressed for disclosure control reasons' : 'c',
                                            'Value suppressed due to incompleteness of  source data' : 'u',
                                            'Interpret with caution' : 'u'}})

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()