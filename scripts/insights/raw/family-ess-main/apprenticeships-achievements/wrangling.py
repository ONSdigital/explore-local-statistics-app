import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')

    df = df.replace({'Period' :{202223 : '2022-08-01T00:00:00/P3M',
                                202122 : '2021-08-01T00:00:00/P1Y',
                                202021 : '2020-08-01T00:00:00/P1Y',
                                201920 : '2019-08-01T00:00:00/P1Y',
                                201819 : '2018-08-01T00:00:00/P1Y',
                                201718 : '2017-08-01T00:00:00/P1Y'}})
    # This dataset uses Academic year which we don't have a template for
    # and I'm fairly certain there isnt a 'government-year/' alternative (eg 'academic-year/')
    # or at least I couldn't find any evidence of one

    indexNames = df[ df['AREACD'].isnull()].index
    df.drop(indexNames, inplace = True)
    # There are 8 values in this dataset under 'na' 'Outside of England and Unknown' which we don't support so removed

    df['Value'] = df.apply(lambda x: None if 'Value suppressed' in str(x['Observation Status']) else x['Value'], axis = 1)
    #for some reason they decided to put the observation status in this column as well
    df['Observation Status'] = df.apply(lambda x: 'low' if 'Value suppressed' in str(x['Observation Status']) else x['Observation Status'], axis = 1)
    #"Value suppressed due to a base value of fewer than 5"
    df['Observation Status'] = df.apply(lambda x: 'x' if 'na' in str(x['Value']) else x['Observation Status'], axis = 1 )
    # There are NA values without an observation stutus, I'm choosing to take them on face value as 'not-available'

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()