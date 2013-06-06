from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
import calendar
import datetime
import json
import time
import pytz

from django.db.models import Count, Sum, Avg
from overview.models import EnergyConsumption


def overview(request):

    response = _getData(request)
    return render_to_response("base.html",
                              {"data": response['whole_data'],
                               "start_point": response['start_point'],
                               "point_interval": response['point_interval'],
                               "tooltip_format": response['tooltip_format'],
                               "months": settings.GRAPH_MONTHS},
                              context_instance=RequestContext(request))

def api(request):
    """Return JSON response"""
    response = _getData(request)

    return HttpResponse(json.dumps(response), mimetype="application/json")


def _getData(request):
    month = request.GET.get('month')
    year = request.GET.get('year')
    point_interval = (60*60*24*1000) / 4  # 6 hours

    # TODO ----- NEED REFACTORING
    big_list = [['Always On'], ['Heating & AC'], ['Refrigeration'], ['Dryer'], ['Cooking'], ['Other'], ['date']]  #TODO
    if month is None or year is None:
        # show whole list
        start_date = datetime.date(2009, 9, 1)
        end_date = datetime.date(2010, 3, 22)
        point_interval = (60*60*24*1000)  # 1 day
        tooltip_format = "%b %e \'%y"

        #TODO - refactor
        heat = EnergyConsumption.objects.extra({'date':"date(datetime_midpoint)"}).values('date').order_by().annotate(
            alwaysSum=Sum('always_on'),
            heatSum=Sum('heating_ac'),
            refrigSum=Sum('refrigeration'),
            dryerSum=Sum('dryer'),
            cookSum=Sum('cooking'),
            otherSum=Sum('other')
            )

        for line in heat:
            print line
            big_list[0].append(line['alwaysSum'])
            big_list[1].append(line['heatSum'])
            big_list[2].append(line['refrigSum'])
            big_list[3].append(line['dryerSum'])
            big_list[4].append(line['cookSum'])
            big_list[5].append(line['otherSum'])
            milli = int(time.mktime((line['date']).timetuple())) * 1000
            big_list[6].append("%i" % milli)

    else:
        days_of_month = calendar.monthrange(int(year),int(month))[1]
        start_date = datetime.datetime(int(year), int(month), 1, tzinfo=pytz.timezone("UTC"))
        end_date = datetime.datetime(int(year), int(month), days_of_month) + datetime.timedelta(days=1)
        tooltip_format = "%b %e, %H:%M"

        heat = EnergyConsumption.objects.filter(datetime_midpoint__range=(start_date, end_date)).order_by().annotate(
            alwaysSum=Sum('always_on'),
            heatSum=Sum('heating_ac'),
            refrigSum=Sum('refrigeration'),
            dryerSum=Sum('dryer'),
            cookSum=Sum('cooking'),
            otherSum=Sum('other')
            )

        for line in heat.values():
            big_list[0].append(line['alwaysSum'])
            big_list[1].append(line['heatSum'])
            big_list[2].append(line['refrigSum'])
            big_list[3].append(line['dryerSum'])
            big_list[4].append(line['cookSum'])
            big_list[5].append(line['otherSum'])
            milli = int(time.mktime((line['datetime_midpoint']).timetuple())) * 1000
            big_list[6].append("%i" % milli)

    # get start point
    start_point = int(time.mktime((heat.values()[0].get('datetime_midpoint')).timetuple())) * 1000

    whole_data = []
    for category in big_list:
        per_category = {"name": category.pop(0),
                        "data": category}

        whole_data.append(per_category)

    response = {"whole_data":whole_data,
                "start_point": "%i" % start_point,
                "point_interval": "%i" % point_interval,
                "tooltip_format": tooltip_format}

    return response
