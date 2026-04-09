'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createComplaint, detectZones } from '@/lib/firebase-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      center: { lat: 19.0760, lng: 72.8777 },
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

    if (!user) return setError('Login required');
    if (!location) return setError('Please select location on map');
    if (!title || !description) return setError('Title and description required');

    setLoading(true);

    try {

      const ward = "K East";

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

      router.push('/admin');

    } catch (err) {
      console.error(err);
      setError('Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* 🔥 DARK GOVT STYLE CARD */}
      <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-sky-600 to-emerald-600 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-semibold">
            Municipal Complaint Registration
          </h2>
          <p className="text-sm text-white/80">
            Fill the form below to report an issue
          </p>
        </div>

        {/* FORM */}
        <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded border border-red-500/30">
                {error}
              </div>
            )}

            {/* TITLE */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Complaint Title *
              </label>
              <Input
                placeholder="Enter complaint title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Complaint Description *
              </label>
              <textarea
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-md p-3"
                rows={4}
              />
            </div>

            {/* MAP */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Location on Map *
              </label>

              <div
                ref={mapRef}
                className="w-full h-96 border border-white/20 rounded-md"
              />
            </div>

            {/* LOCATION */}
            {location && (
              <div className="bg-white/10 border border-white/20 px-4 py-2 rounded text-sm text-gray-300">
                📍 {location.address}
              </div>
            )}

            {/* BUTTON */}
            <Button
              type="submit"
              disabled={loading || !mapLoaded}
              className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 
              hover:scale-105 transition text-white py-3"
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>

          </form>

        </div>

      </div>

    </div>

  );
}