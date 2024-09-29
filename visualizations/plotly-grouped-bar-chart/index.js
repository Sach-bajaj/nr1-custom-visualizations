import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer } from 'nr1';
import Plot from 'react-plotly.js';

export default class GroupedBarChartVisualization extends React.Component {
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
        // console.log(rawData);
        // Construct the initial data structure from the raw data
        rawData.forEach(({ metadata, data }) => {
            const facet1 = metadata.groups[1].value;
            const facet2 = metadata.groups[2].value;
    
            // Find or create an entry for facet1Value
            let entry = transformedData.find(e => e.name === facet1);
            if (!entry) {
                entry = { name: facet1 };
                transformedData.push(entry);
            }
    
            // Assign the data
            entry[facet2] = data[0].y;

        });
    
        // As we need to return the yAxisLabel too, let's fetch it here
        const yAxisLabel = rawData && rawData.length > 0 && rawData[0].metadata.groups[0].displayName
        ? rawData[0].metadata.groups[0].displayName
        : 'Y-Axis'; // Default label if none found

        return {
            data: transformedData,
            yAxisLabel // Include this additional field to hold the Y-Axis Label
        };
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
                                return <ErrorState />;
                            }
        
                            const { data: transformedData, yAxisLabel } = this.transformData(data);
                            
                            // Extract the keys for facets across all transformed data
                            const facetKeys = transformedData
                                .flatMap(entry => Object.keys(entry))
                                .filter(key => key !== 'name');
                            const uniqueFacetKeys = Array.from(new Set(facetKeys));
        
                            // Prepare data for Plotly
                            const plotlyData = uniqueFacetKeys.map(facet2 => ({
                                x: transformedData.map(entry => entry.name),
                                y: transformedData.map(entry => entry[facet2] || 0),
                                type: 'bar',
                                name: facet2,
                                hoverlabel: { namelength: -1 } // display full text without truncation
                            }));
                            
                            // Create the layout
                            const layout = {
                                barmode: 'group',
                                xaxis: {
                                    automargin: true 
                                },
                                yaxis: {
                                    title: yAxisLabel,
                                    automargin: true
                                },
                                margin: {
                                    t: 0,
                                    b: 0,
                                    pad: 10
                                }
                            };

                            // Create the configuration object to remove Plotly logo
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
                SELECT average(pageRenderingDuration) FROM PageView FACET userAgentName, countryCode SINCE 1 MONTH AGO
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