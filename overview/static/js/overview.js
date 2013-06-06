//namespace
if(!NL || typeof NL === "undefined") {
    var NL = {};
}

//Backbone
NL.views = {};
NL.models = {};


//document ready
$(function(e){

    var mainView = new NL.views.MainView({
	el: $("#container"),
	model: new NL.models.EnergyModel
    });
});

NL.models.EnergyModel = Backbone.Model.extend({
    url: '/api',

    defaults:{
	chart: null,
	graphData: null,
	pointStart: Number(start_point), // in millisecond
	pointInterval: Number(point_interval),
	tooltipLabelFormat: tooltip_format,
	options: null
    },

    initialize: function() {

	var xAxisCategories = [];
	for(i in myseries) {
	    if(myseries[i].name !== "date") {
		for(var num in myseries[i].data) {
		    myseries[i].data[num] = parseFloat(myseries[i].data[num]);
		}
	    } else {
		xAxisCategories = myseries.splice(i, 1);
	    }
	}
	this.set({graphData:myseries});

	var options = {
	    chart: {
		renderTo: 'energygraph',
		type: 'area'
	    },
	    colors: [
		'#089a1a',
		'#2152c9',
		'#8bbc21',
		'#f87a67',
		'#2f7ed8',
		'#fd4d91',
		'#a6c96a'
	    ],
	    title: {
		text: ""
	    },
	    tooltip: {
		dateTimeLabelFormats : {
                    day : tooltip_format,
                    month : '%b \'%y',
                    year : '%b %e \' %y'
		}
            },
	    xAxis: {
		type: "datetime",
		labels: {
		    rotation: -45,
		    align: 'right',
		    style: {
			fontSize: '13px',
			fontFamily: 'Verdana, sans-serif'
		    }
		},
		dateTimeLabelFormats : {
                    hour : '%H:%M',
                    day : '%b %e',
                    week : '%b %e',
                    month : '%b \'%y',
                    year : '%b %e \' %y'
		}
	    },
	    yAxis: {
		title: {
		    text: 'kwh'
		}
	    },
	    plotOptions: {
		area: {
		    marker: {
			enabled:false
		    }
		},
		series: {
		    pointStart: this.get('pointStart'), // in millisecond
		    pointInterval: this.get('pointInterval'),
		    stacking: 'normal',
		    lineWidth: 1
		}
	    },
	    series: this.get('graphData')
	};
	this.set({options:options});
    },

    getData: function(month, year) {

	var self = this;
	this.fetch({
	    data:{"month":month, "year":year},
	    success: function(a, response) {

		var resultArray = [];
		var graphData = response['whole_data'];

		for(i in graphData) {
		    if(graphData[i].name !== "date") {
			for(var num in graphData[i].data) {
			    graphData[i].data[num] = parseFloat(graphData[i].data[num]);
			}
			resultArray.push(graphData[i].data);
		    } else {
			var poped = graphData.splice(i, 1);
		    }
		}

		self.set({pointStart:response['start_point']});
		self.set({pointInterval:response['point_interval']});
		self.set({tooltipLabelFormat:response['tooltip_format']});
		self.set({graphData:resultArray});

	    }
	});
    },

    parse: function(response) {

	var data = response['whole_data'];

	var resultArray = [];
	for(i in data) {
	    if(data[i].name !== "date") {
		for(var num in data[i].data) {
		    data[i].data[num] = parseFloat(data[i].data[num]);
		}
		resultArray.push(data[i].data);
	    }
	}
	return resultArray;
    }

});

NL.views.MainView = Backbone.View.extend({
    initialize: function() {
	var graphSwitchView = new NL.views.GraphSwitchView({
	    el:$("#switch"),
	    model: this.model
	});

	this.model.bind("change:graphData", this.updateGraph, this);

	this.render();
    },

    render: function() {
	var chart = new Highcharts.Chart(this.model.get('options'));

	this.model.set({chart:chart});
    },

    updateGraph: function() {
	var chart = this.model.get('chart');

	var graphData = this.model.get('graphData');

	var pointStart = this.model.get('pointStart');
	var pointInterval = this.model.get('pointInterval');

	chart.tooltip.options.dateTimeLabelFormats = {
            day : this.model.get('tooltipLabelFormat')
	};

	$.each(graphData, function(i, data){
	    chart.series[i].update({
		data: data,
		pointStart: Number(pointStart),
		pointInterval: Number(pointInterval)
	    }, true);
	});

    }
});

NL.views.GraphSwitchView = Backbone.View.extend({
    events: {
	"click button": "updateGraph"
    },

    updateGraph: function(e) {

	if (e && e.target) {
	    if (e.target.id === "reset") {
		this.model.getData();
	    } else {
		var $month = $(e.target);
		this.model.getData($month.data('month'), $month.data('year'));
	    }
	}
    }

});
