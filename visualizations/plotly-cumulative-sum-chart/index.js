import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer } from 'nr1';
import Plot from 'react-plotly.js';

export default class CumulativeSumChartVisualization extends React.Component {
    static propTypes = {
        nrqlQueries: PropTypes.arrayOf(
            PropTypes.shape({
                accountId: PropTypes.number,
                query: PropTypes.string,
            })
        ),
    };

    transformData = (rawData) => {
        const transformedData = [];

        rawData.forEach(({ metadata, data }) => {
            const facet1 = metadata.groups[1].value;
            const facet2 = metadata.groups[2].value;
    
            let entry = transformedData.find(e => e.name === facet1);
            if (!entry) {
                entry = { name: facet1 };
                transformedData.push(entry);
            }

            entry[facet2] = data[0].y;
        });
    
        const yAxisLabel = rawData && rawData.length > 0 && rawData[0].metadata.groups[0].displayName
            ? rawData[0].metadata.groups[0].displayName
            : 'Y-Axis';

        return {
            data: transformedData,
            yAxisLabel
        };
    };

    calculateCumulativeSum = (data) => {
        // Sort data based on facet1 (assumed to be the 'name' property)
        const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));

        const cumulativeData = {};
        const result = [];

        sortedData.forEach(entry => {
            const cumulativeEntry = { name: entry.name };
            Object.keys(entry).forEach(key => {
                if (key !== 'name') {
                    cumulativeData[key] = (cumulativeData[key] || 0) + (entry[key] || 0);
                    cumulativeEntry[key] = cumulativeData[key];
                }
            });
            result.push(cumulativeEntry);
        });

        // Carry forward the cumulative values in case some entries do not have all keys
        const allFacet2s = Array.from(new Set(sortedData.flatMap(entry => Object.keys(entry).filter(key => key !== 'name'))));
        
        result.forEach((entry, index) => {
            allFacet2s.forEach(key => {
                if(entry[key] === undefined) {
                    entry[key] = index > 0 ? result[index - 1][key] : 0;
                }
            });
        });

        return result;
    };

    render() {
        const { nrqlQueries } = this.props;

        if (!nrqlQueries || !nrqlQueries.length || !nrqlQueries[0].accountId || !nrqlQueries[0].query) {
            return <EmptyState />;
        }

        return (
            <AutoSizer>
                {({ width, height }) => (
                    <NrqlQuery
                        query={nrqlQueries[0].query}
                        accountId={parseInt(nrqlQueries[0].accountId)}
                        pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                    >
                        {({ data, loading, error }) => {
                            if (loading) {
                                return <Spinner />;
                            }
                            
                            if (error) {
                                return null;  // Return null instead of <ErrorState />
                            }

                            const { data: transformedData, yAxisLabel } = this.transformData(data);
                            const cumulativeData = this.calculateCumulativeSum(transformedData);

                            const facetKeys = cumulativeData
                                .flatMap(entry => Object.keys(entry))
                                .filter(key => key !== 'name');
                            const uniqueFacetKeys = Array.from(new Set(facetKeys)).sort();

                            const plotlyData = uniqueFacetKeys.map(facet2 => ({
                                x: cumulativeData.map(entry => entry.name),
                                y: cumulativeData.map(entry => entry[facet2] || 0),
                                mode: 'lines',
                                name: facet2,
                                hoverlabel: { namelength: -1 }
                            }));

                            const layout = {
                                xaxis: {
                                    automargin: true 
                                },
                                yaxis: {
                                    title: yAxisLabel,
                                    automargin: true
                                },
                                legend: {
                                    x: 1.1,
                                    y: 0,
                                    xanchor: 'right',
                                    yanchor: 'bottom'
                                },
                                margin: {
                                    t: 0,
                                    b: 0,
                                    pad: 10
                                }
                            };

                            const config = {
                                displaylogo: false
                            };

                            return (
                                <Plot
                                    data={plotlyData}
                                    layout={layout}
                                    useResizeHandler
                                    style={{ width: '100%', height: '100%' }}
                                    config={config}
                                />
                            );
                        }}
                    </NrqlQuery>
                )}
            </AutoSizer>
        );
    }
}

const EmptyState = () => (
    <Card className="EmptyState">
        <CardBody className="EmptyState-cardBody">
            <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_3}
            >
                Please provide at least one NRQL query & account ID pair
            </HeadingText>
            <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
                type={HeadingText.TYPE.HEADING_4}
            >
                An example NRQL query you can try is:
            </HeadingText>
            <code>
                SELECT sum(numeric(Value)) AS 'Cumulative Sum' FROM lookup(salesData) FACET Date, `Product Sold` 
            </code>
        </CardBody>
    </Card>
);

const ErrorState = () => (
    <Card className="ErrorState">
        <CardBody className="ErrorState-cardBody">
            <HeadingText
                className="ErrorState-headingText"
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_3}
            >
                Oops! Something went wrong.
            </HeadingText>
        </CardBody>
    </Card>
);