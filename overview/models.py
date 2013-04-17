from django.db import models


class EnergyConsumption(models.Model):
    always_on = models.FloatField()
    heat_ac = models.FloatField()
    fridge = models.FloatField()
    dryer = models.FloatField()
    cooking = models.FloatField()
    other = models.FloatField()
    datetime = models.DateTimeField()

    class Meta:
        db_table = "energy_consumption"
