'use client'

import Heatmap from "@/components/heatmap"
import { Navigation } from "@/components/Navigation"

export default function ZonesPage(){

return(

<main className="min-h-screen bg-gray-50">

<Navigation/>

<div className="p-6">

<h1 className="text-3xl font-bold mb-6">
Zones Heatmap
</h1>

<Heatmap/>

</div>

</main>

)

}