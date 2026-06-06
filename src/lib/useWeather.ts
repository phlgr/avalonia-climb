import { useQuery } from '@tanstack/react-query'
import { fetchWeather } from './weather'

/** Shared cached weather query — both routes read from the same cache entry. */
export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 1000 * 60 * 15,
    retry: 1,
  })
}
