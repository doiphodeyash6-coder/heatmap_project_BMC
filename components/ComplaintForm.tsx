'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createComplaint, detectZones } from '@/lib/firebase-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useJsApiLoader } from "@react-google-maps/api";
import { googleMapsLibraries } from "@/lib/googleMapsLoader";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export function ComplaintForm() {

  const { user } = useAuth();
  const router = useRouter();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: googleMapsLibraries as any,
  });

  useEffect(() => {

    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 19.0760, lng: 72.8777 }, // Mumbai center
      zoom: 13,
    });

    map.addListener('click', (e: any) => {

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (markerRef.current) markerRef.current.setMap(null);

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map
      });

      markerRef.current = marker;

      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {

          if (status === "OK" && results && results.length > 0) {

            setLocation({
              latitude: lat,
              longitude: lng,
              address: results[0].formatted_address
            });

          } else {

            setLocation({
              latitude: lat,
              longitude: lng,
              address: `${lat}, ${lng}`
            });

          }

        }
      );

    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

  }, [isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError('');

    if (!user) {
      setError('Login required');
      return;
    }

    if (!location) {
      setError('Please select location on map');
      return;
    }

    if (!title || !description) {
      setError('Title and description required');
      return;
    }

    setLoading(true);

    try {

      const ward = "K East"; // temporary ward

      await createComplaint({
        userid: user.uid,
        title,
        description,
        category: "other",
        severity: "medium",
        location,
        ward,
        status: "open",
        photos: []
      });

      await detectZones();

    router.push('/admin')

    } catch (err) {

      console.error(err);
      setError('Failed to create complaint');

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="max-w-4xl mx-auto px-4 py-8">

      <Card>

        <CardHeader>
          <CardTitle>Report Complaint</CardTitle>
          <CardDescription>Select location on map</CardDescription>
        </CardHeader>

        <CardContent>

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="text-red-600">
                {error}
              </div>
            )}

            <Input
              placeholder="Complaint Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Complaint Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <div
              ref={mapRef}
              className="w-full h-96 border rounded"
            />

            {location && (
              <p className="text-sm text-gray-600">
                Selected Location: {location.address}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !mapLoaded}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>

  );

}