import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer } from 'nr1';
import Plot from 'react-plotly.js';

// Define the color sequence directly within the code
const PLOTLY_COLORS = [
    '#636EFA',
    '#EF553B',
    '#00CC96',
    '#AB63FA',
    '#FFA15A',
    '#19D3F3',
    '#FF6692',
    '#B6E880',
    '#FF97FF',
    '#FECB52'
    // Add more colors if you have more bars than the number of colors here
];

export default class VerticalBarChartVisualization extends React.Component {
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

        // Construct the initial data structure from raw data
        rawData.forEach(({ metadata, data }) => {
            const facet1 = metadata.groups[1].value;
            const value = data[0].y;
            transformedData.push({ name: facet1, value });
        });

        // Sort the transformedData by value in descending order
        transformedData.sort((a, b) => b.value - a.value);

        // Map to x and y for the bars
        const barData = transformedData.map((entry) => entry.value);

        return {
            barData,
            categories: transformedData.map(entry => entry.name) // The names for the x-axis categories.
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

                            const { barData, categories } = this.transformData(data);

                            // Fetch the axis labels
                            const xAxisLabel = data && data[0].metadata.groups[0].displayName;
                            const yAxisLabel = data && data[0].metadata.groups[1].displayName;

                            // Prepare data for Plotly - updated for vertical bar chart
                            const plotlyData = [
                                {
                                    x: categories,
                                    y: barData,
                                    type: 'bar', // This creates vertical bars
                                    orientation: 'v', // This line can be omitted as 'v' is the default value
                                    marker: {
                                        color: barData.map((_, i) => PLOTLY_COLORS[i % PLOTLY_COLORS.length])
                                    },
                                    hoverlabel: { namelength: -1 }
                                }
                            ];

                            // Create the layout
                            const layout = {
                                barmode: 'group',
                                xaxis: {
                                    title: {
                                        text: xAxisLabel,
                                        font: {
                                            weight: 'bold'
                                        }
                                    },
                                    automargin: true,
                                    showgrid: true,
                                    tickmode: 'array',
                                    tickvals: categories.map((c, index) => index),
                                    ticktext: categories,
                                },
                                yaxis: {
                                    title: {
                                        text: yAxisLabel,
                                        font: {
                                            weight: 'bold'
                                        }
                                    },
                                    automargin: true,
                                    showgrid: true,
                                    zeroline: false
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
                An example NRQL query you can try is (remember to only use ONE facet):
            </HeadingText>
            <code>
                SELECT median(duration) AS 'Median Duration (s)' FROM PageView FACET countryCode AS 'Country' SINCE 3 MONTHS AGO LIMIT MAX
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