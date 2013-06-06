from django.db import models


class EnergyConsumption(models.Model):
    always_on = models.FloatField()
    heating_ac = models.FloatField()
    refrigeration = models.FloatField()
    dryer = models.FloatField()
    cooking = models.FloatField()
    other = models.FloatField()
    datetime_midpoint = models.DateTimeField()
    row_id = models.IntegerField(primary_key=True)

    class Meta:
        db_table = "energy_consumption"
