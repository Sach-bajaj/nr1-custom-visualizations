import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer } from 'nr1';
import Plot from 'react-plotly.js';

export default class StackedBarChartVisualization extends React.Component {
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
            console.log(rawData);
            const facet1 = metadata.groups[1].value;
            const facet2 = metadata.groups[2].value;

            // Find or create an entry for facet1Value
            let entry = transformedData.find(e => e.name === facet1);
            if (!entry) {
                entry = { name: facet1, total: 0 };
                transformedData.push(entry);
            }

            // Assign the data and update the total
            entry[facet2] = data[0].y;
            entry.total += data[0].y;
        });

        // Calculate the percentages from the totals
        transformedData.forEach((entry) => {
            Object.keys(entry).forEach((key) => {
                if (key !== 'name' && key !== 'total') {
                    entry[key] = (entry[key] / entry.total) * 100;
                }
            });
            delete entry.total; // remove total as its no longer needed
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
                                text: transformedData.map(entry => entry[facet2] ? `${entry[facet2].toFixed(2)}%` : ''),
                                textposition: 'inside',
                                hoverinfo: 'x+text', // 'x' corresponds to the 'name' from 'entry', 'text' is the percentage label we added
                                hovertemplate: transformedData.map(entry => `<b>${facet2}:</b> ${entry[facet2] ? `${entry[facet2].toFixed(2)}%` : ''}<extra></extra>`),
                            }));

                            // Create the layout
                            const layout = {
                                barmode: 'stack',
                                xaxis: {
                                    automargin: true
                                },
                                yaxis: {
                                    title: 'Percentage of ' + yAxisLabel,
                                    automargin: true,
                                    tickvals: [0, 20, 40, 60, 80, 100],
                                    ticktext: ['0%', '20%', '40%', '60%', '80%', '100%']
                                },
                                legend: {
                                    orientation: 'h',
                                    y: -0.1 // Legend just below the chart
                                },
                                // This provides better control over text and bar colors to ensure readability
                                textposition: 'auto',
                                // Ensure the data is shown as percentages
                                hoverinfo: 'text',
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
                SELECT sum(GigabytesIngested) FROM NrConsumption WHERE usageMetric NOT IN ('MetricsBytes','CustomEventsBytes') FACET monthOf(timestamp), usageMetric SINCE 3 MONTH AGO LIMIT MAX
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