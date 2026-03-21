'use client'

import { useEffect, useRef, useState } from "react"
import { useJsApiLoader } from "@react-google-maps/api"
import { getAllComplaints } from "@/lib/firebase-service"
import { googleMapsLibraries } from "@/lib/googleMapsLoader"

export default function Heatmap(){

const mapRef = useRef<HTMLDivElement>(null)
const mapInstanceRef = useRef<any>(null)
const heatmapRef = useRef<any>(null)

const [complaints,setComplaints] = useState<any[]>([])

const { isLoaded } = useJsApiLoader({
googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
libraries: googleMapsLibraries as any
})

useEffect(()=>{

loadComplaints()

},[])

const loadComplaints = async () =>{

const data = await getAllComplaints()

setComplaints(data)

}

useEffect(()=>{

if(!isLoaded || !mapRef.current) return

if(mapInstanceRef.current) return

const map = new google.maps.Map(mapRef.current,{
center:{ lat:19.0760, lng:72.8777 }, // Mumbai
zoom:12
})

mapInstanceRef.current = map

},[isLoaded])


useEffect(()=>{

if(!mapInstanceRef.current) return
if(complaints.length === 0) return

const points = complaints.map((c:any)=>{

return new google.maps.LatLng(
c.location.latitude,
c.location.longitude
)

})

const heatmap = new google.maps.visualization.HeatmapLayer({

data:points,
radius:40

})

heatmap.setMap(mapInstanceRef.current)

heatmapRef.current = heatmap

},[complaints])


return(

<div
ref={mapRef}
className="w-full h-[500px] rounded border"
/>

)

}