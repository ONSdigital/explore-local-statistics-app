import click
import pandas as pd
from pathlib import Path


@click.command()
@click.argument("input", type=click.Path(exists=True, path_type=Path))
@click.option("--output", default=Path("./output.csv"), type=click.Path(path_type=Path))
def wrangle(input: Path(), output: Path()) -> None:
    df = pd.read_csv(input, na_values = 'na')
    
    #Some AREANM do not have AREACD, those are set as 'na', thus those rows are dropped
    df.drop(df[df['AREACD'].isna()].index, inplace=True)
    
  

    #indexNames = df[ df['AREACD'].isnull()].index
   # df.drop(indexNames, inplace = True)

    #indexNames = df[ df['AREACD'].isin(['W42000001', 'W42000004', 'TLX'])].index
   # df.drop(indexNames, inplace = True)

    #df['AREACD'] = df.apply(lambda x: 'itl1/' + x['AREACD'].lower() if 'Level 1' in str(x['Geography']) else ('itl2/' + x['AREACD'].lower() if 'Level 2' in str(x['Geography']) else x['AREACD']), axis = 1) """

    df.to_csv(output, index=False)
    return


if __name__ == "__main__":

    wrangle()