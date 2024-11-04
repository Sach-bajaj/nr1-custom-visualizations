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

        // Helper function to convert hex color to RGB
        const hexToRgb = (hex) => {
            let r = parseInt(hex.slice(1, 3), 16);
            let g = parseInt(hex.slice(3, 5), 16);
            let b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };

        // Helper function to convert RGB back to hex
        const rgbToHex = (r, g, b) => {
            return (
                "#" +
                [r, g, b].map((x) => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? "0" + hex : hex;
                }).join("")
            );
        };

        // Helper function to invert a hex color
        const invertColor = (hex) => {
            const { r, g, b } = hexToRgb(hex);
            return rgbToHex(255 - r, 255 - g, 255 - b);
        };
    
        // Construct the initial data structure from the raw data
        rawData.forEach(({ metadata, data }) => {
            // console.log(rawData);
            if (metadata.groups < 2) {
                return;
            }
            
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
            chartColors[facet2] = invertColor(metadata.color);
        });
    
        // Now sort the transformed data by the 'name' property (alphabetically)
        const sortedTransformedData = transformedData.sort((a, b) => {
            const aName = a.name, bName = b.name;
            const aIsNumber = !isNaN(Number(aName));
            const bIsNumber = !isNaN(Number(bName));
        
            // If both are numbers, compare as numbers
            if (aIsNumber && bIsNumber) {
                return Number(aName) - Number(bName);
            }
        
            // If one is a number and the other isn't, the number comes first
            if (aIsNumber) return -1;
            if (bIsNumber) return 1;
        
            // If both are not numbers, compare as strings
            return aName.localeCompare(bName);
        });

        // As we need to return the yAxisLabel too, let's fetch it here
        const yAxisLabel = rawData && rawData.length > 0 && rawData[0].metadata.groups[0].displayName
        ? rawData[0].metadata.groups[0].displayName
        : 'Y-Axis'; // Default label if none found

        return {
            data: sortedTransformedData,
            chartColors,
            yAxisLabel // Include this additional field to hold the Y-Axis Label
        };
    };

    // Format the tick presentation on the XAxis
    formatTick = (tickItem) => {
        return tickItem.toString();
    };

    // Formatter function to round values to two decimal places
    tooltipFormatter = (value) => {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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
        
                            const { data: transformedData, chartColors, yAxisLabel } = this.transformData(data);
                            
                            // Extract the keys for the countries across all transformed data
                            const facetKeys = transformedData
                                .flatMap(entry => Object.keys(entry))
                                .filter(key => key !== 'name')
                                .sort((a, b) => {
                                        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

                                        const [aMonth, aYear] = a.split(" ");
                                        const [bMonth, bYear] = b.split(" ");
                                
                                        if (aYear !== bYear) {
                                            return parseInt(aYear) - parseInt(bYear);
                                        }
                                
                                        return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
                                    });
                            const uniqueFacetKeys = Array.from(new Set(facetKeys));
        
                            return (
                                <BarChart
                                    width={width-30}
                                    height={height-20}
                                    data={transformedData}
                                    margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                                    barCategoryGap={'10%'}
                                >
                                    <XAxis dataKey="name" />
                                    <YAxis 
                                        tickFormatter={(value) => value.toLocaleString()}
                                        label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: -35, style: { fontWeight: 'bold' } }} />
                                    <Tooltip formatter={this.tooltipFormatter} />
                                    <Legend />
                                    {uniqueFacetKeys.map(facet2 => (
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
