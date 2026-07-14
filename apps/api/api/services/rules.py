from math import atan2, cos, radians, sin, sqrt


CATEGORY_TAGS: dict[str, list[str]] = {
    "hospital": ['["amenity"="hospital"]'],
    "police": ['["amenity"="police"]'],
    "fire_station": ['["amenity"="fire_station"]'],
    "pharmacy": ['["amenity"="pharmacy"]'],
    "restaurant": ['["amenity"="restaurant"]'],
    "cafe": ['["amenity"="cafe"]'],
    "tourism": ['["tourism"~"attraction|museum|viewpoint"]'],
    "school": ['["amenity"="school"]'],
    "college": ['["amenity"~"college|university"]'],
    "supermarket": ['["shop"="supermarket"]'],
    "bank": ['["amenity"="bank"]'],
    "atm": ['["amenity"="atm"]'],
    "park": ['["leisure"="park"]'],
    "bus_stop": ['["highway"="bus_stop"]'],
    "railway_station": ['["railway"="station"]'],
}


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    a = sin(delta_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lon / 2) ** 2
    return 2 * radius * atan2(sqrt(a), sqrt(1 - a))
