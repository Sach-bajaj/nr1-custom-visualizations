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
    // Add more colors if needed
];

export default class HorizontalBarChartVisualization extends React.Component {
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
            const facet = metadata.groups[1].value;
            const value = data[0].y;
            transformedData.push({ name: facet, value });
        });

        // Sort the transformedData by value in descending order
        transformedData.sort((a, b) => b.value - a.value);

        // Map to x and y for the bars
        const x = transformedData.map((entry) => entry.value);
        const y = transformedData.map((entry) => entry.name);

        return {
            x: x.reverse(), // Reverse the order to have the longest bar at the top
            y: y.reverse(), // Also reverse the category labels to maintain the correct association
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

                            const { x, y } = this.transformData(data);

                            // Fetch the axis labels, swapping the labels for the vertical chart
                            const xAxisLabel = data && data[0].metadata.groups[1].displayName; // Notice the change of index to '1'
                            const yAxisLabel = data && data[0].metadata.groups[0].displayName; // and '0' here to match the values properly

                            const plotlyData = [
                                {
                                    x,
                                    y,
                                    type: 'bar',
                                    orientation: 'h',
                                    marker: {
                                        color: x.map((_, i) => PLOTLY_COLORS[i % PLOTLY_COLORS.length]) // Loop through colors
                                    },
                                    hoverlabel: { namelength: -1 }
                                }
                            ];

                            // Create the layout
                            const layout = {
                                barmode: 'group',
                                xaxis: {
                                    title: {
                                        text: yAxisLabel,
                                        font: {
                                            weight: 'bold'
                                        }
                                    },
                                    automargin: true,
                                    showgrid: true,
                                },
                                yaxis: {
                                    title: {
                                        text: xAxisLabel,
                                        font: {
                                            weight: 'bold'
                                        }
                                    },
                                    automargin: true,
                                    showgrid: true,
                                    type: 'category' // Categories are usually set on the y-axis for vertical bar charts
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
                SELECT sum(GigabytesIngested) FROM NrConsumption WHERE usageMetric NOT IN ('MetricsBytes','CustomEventsBytes') FACET usageMetric SINCE 1 MONTH AGO LIMIT MAX
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