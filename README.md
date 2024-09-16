# nr1-custom-visualizations
A custom visualization Nerdpack for New Relic containing charts not found in New Relic by default.

## Plotly
The following charts are made with Plotly.

### Grouped Bar Chart
This is a Grouped Bar Chart with two FACETs made with Plotly.
![Grouped Bar Chart](/visualizations/plotly-grouped-bar-chart/grouped-bar-chart.png)

### 100% Stacked Bar Chart
A variation on the stacked bar chart where each bar adds up to 100%.
![100% Stacked Bar Chart](/visualizations/plotly-100-stacked-bar-chart/100-stacked-bar-chart.png)

## Recharts
The following charts are made with Recharts.

### Simple Bar Chart
Made with Recharts, this is a Grouped Bar Chart is used with two FACETs.
![Simple Bar Chart](/visualizations/recharts-simple-bar-chart/simple-bar-chart.png)

### Treemap
Made with Recharts, this Treemap is animated.
![Treemap Chart](/visualizations/recharts-radar-or-treemap/treemap-chart.png)

### Radar Chart
This is the default visualzation when you create a custom visualization:  
https://docs.newrelic.com/docs/new-relic-solutions/build-nr-ui/custom-visualizations/build-visualization/
![Radar Chart](/visualizations/recharts-radar-chart/radar-chart.png)

## Prerequisites

Run the following and make sure there are no errors.

```
git --version
npm -v
```

## Setup NR1 CLI
Get the New Relic One Command Line Interface (nr1-cli) here:

| OS | Direct Link |
| :- | :---------- |
| Windows | https://cli.nr-ext.net/installer.exe |
| Linux | `curl -s https://cli.nr-ext.net/installer.sh \| sudo bash` |
| Mac | https://cli.nr-ext.net/installer.pkg |

Once `NR1 CLI` is installed, run the following to set up your profile
```
nr1 profiles:add --name <your-profile-name> --api-key NRAK-XXXXXXXXXXXXXXXXXXXXXXXXXXX --region us
```

Check to make sure you are in the correct profile by using this command:
```
nr1 profiles:whoami
```

If you've installed nr1-cli in the past, you might have an old profile. Check it:
```
nr1 profiles:list
```

Otherwise, change your default profile to the account you need. It'll ask you to select the account with the up/down arrows on your keyboard to choose the default.
```
nr1 profiles:default
```

If you want to double-check everything is good:
```
cd ~/.newrelic
cat ./default-profile.json --> Check the profile name is correct
cat ./credentials.json --> Check the user API key and region is correct
```

If you've used nr1-cli before, delete everything in the `/certs` folder:
```
cd ~/.newrelic/certs
ls
rm -fr xxxx xxxx xxxx ...
```

## Setup NerdPack

```
git clone https://github.com/pnvnd/nr1-custom-visualizations.git
cd nr1-custom-visualizations
npm install
nr1 nerdpack:uuid --generate --force
```

Keep note of the `uuid`, this will be important later when you want to remove this for good.

Now, check:
```
nr1 nerdpack:info
```
The “id” here is the `uuid` generated in the previous step and should match the id in the `nr1.json` file.

Finally, do this to test it locally:
```
nr1 nerdpack:serve
```

Paste in the link from the console and check out the Nerdpack.  Once everything is good:

```
nr1 nerdpack:publish
```

## Update Nerdpack
When updates are available, you can update by simply navigating to the command-center-v2 repository and do this:
```
git pull
nr1 nerdpack:publish
```

Then, you can subscribe to the new version of the application from the New Relic user interface.

## Uninstall Nerdpack
To uninstall the Nerdpack completely, get the `uuid` for your application. One example:
```
nr1 subscription:list
```
Then, in the New Relic user interface, unsubscribe from the application for ALL accounts.

Finally, using your application’s `uuid``, un-deploy your application:
```
nr1 nerdpack:undeploy --nerdpack-id=xxxxx
```
## Reference
https://developer.newrelic.com/explore-docs/nr1-nerdpack/#nr1-nerdpackuntag  
https://developer.newrelic.com/build-apps/publish-deploy/subscribe/

