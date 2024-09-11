import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer } from 'nr1';

// https://recharts.org/en-US/examples/SimpleBarChart
export default class SimpleBarChartVisualization extends React.Component {
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
        const chartColors = {};
    
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
    
            // Assign the data and color
            entry[facet2] = data[0].y;
            chartColors[facet2] = metadata.color;
        });
    
        // Now sort the transformed data by the 'name' property (alphabetically)
        const sortedTransformedData = transformedData.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    
        return {
            data: sortedTransformedData,
            chartColors,
        };
    };

    // Format the tick presentation on the XAxis
    formatTick = (tickItem) => {
        return tickItem.toString();
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
        
                            const { data: transformedData, chartColors } = this.transformData(data);
                            
                            // Extract the keys for the countries across all transformed data
                            const countryKeys = transformedData
                                .flatMap(entry => Object.keys(entry))
                                .filter(key => key !== 'name');
                            const uniqueCountryKeys = Array.from(new Set(countryKeys));
        
                            return (
                                <BarChart
                                    width={width}
                                    height={height}
                                    data={transformedData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                    barCategoryGap={'10%'}
                                >
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {uniqueCountryKeys.map(facet2 => (
                                        <Bar
                                            key={facet2}
                                            dataKey={facet2}
                                            fill={chartColors[facet2]}
                                            name={facet2}
                                        />
                                    ))}
                                </BarChart>
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