import { CheckCircleIcon, CheckIcon } from '@heroicons/react/20/solid'

const classestiers = [
    {
        name: '"I train from time to time"',
        id: 'tier-freelancer',
        href: '#',
        priceMonthly: '25 credits',
        description: '1 class',
        features: ['5 products', 'Up to 1,000 subscribers', 'Basic analytics', '48-hour support response time'],
        mostPopular: false,
    },
    {
        name: '"I train everyday"',
        id: 'tier-startup',
        href: '#',
        priceMonthly: '100 credits',
        description: '5 classes',
        features: [
            '25 products',
            'Up to 10,000 subscribers',
            'Advanced analytics',
            '24-hour support response time',
            'Marketing automations',
        ],
        mostPopular: true,
    },
    {
        name: 'Eat, sleep, gym, repeat',
        id: 'tier-enterprise',
        href: '#',
        priceMonthly: '150 credits',
        description: '10 classes',
        features: [
            'Unlimited products',
            'Unlimited subscribers',
            'Advanced analytics',
            '1-hour, dedicated support response time',
            'Marketing automations',
        ],
        mostPopular: false,
    },
]

const individualtiers = [
    {
        name: 'Workout of the day',
        id: 'tier-basic',
        href: '#',
        price: { monthly: '200', annually: '$12' },
        description: '10 classes',
        features: ['5 products', 'Up to 1,000 subscribers', 'Basic analytics', '48-hour support response time'],
    },
    {
        name: 'Private training',
        id: 'tier-essential',
        href: '#',
        price: { monthly: '350', annually: '$24' },
        description: '10 classes',
        features: [
            '25 products',
            'Up to 10,000 subscribers',
            'Advanced analytics',
            '24-hour support response time',
            'Marketing automations',
        ],
    },
    {
        name: 'Semi-Private',
        id: 'tier-growth',
        href: '#',
        price: { monthly: '300', annually: '$48' },
        description: '10 classes',
        features: [
            'Unlimited products',
            'Unlimited subscribers',
            'Advanced analytics',
            '1-hour, dedicated support response time',
            'Marketing automations',
            'Custom reporting tools',
        ],
    },
]


function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Bundles() {
    return (
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h1 className='text-3xl text-green-500 font-bold'>Classes</h1>
            <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1  gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                {classestiers.map((tier, tierIdx) => (
                    <div
                        key={tier.id}
                        className={classNames(
                            tier.mostPopular ? 'lg:z-10 lg:rounded-b-none' : 'lg:mt-8',
                            tierIdx === 0 ? 'lg:rounded-r-none' : '',
                            tierIdx === classestiers.length - 1 ? 'lg:rounded-l-none' : '',
                            'flex flex-col justify-between rounded-3xl bg-gray-200 p-8 ring-1 ring-gray-200 xl:p-10',
                        )}
                    >
                        <div>
                            <div className="flex items-center justify-between gap-x-4">
                                <h3
                                    id={tier.id}
                                    className={classNames(
                                        tier.mostPopular ? 'text-green-400' : 'text-gray-900',
                                        'text-lg font-semibold leading-8',
                                    )}
                                >
                                    {tier.name}
                                </h3>
                                {tier.mostPopular ? (
                                    <p className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-green-400">
                                        Most popular
                                    </p>
                                ) : null}
                            </div>
                            <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
                            <p className="mt-6 flex items-baseline gap-x-1">
                                <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.priceMonthly}</span>
                                <span className="text-sm font-semibold leading-6 text-gray-600"></span>
                            </p>
                            {/* <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul> */}
                        </div>
                        <a
                            href={tier.href}
                            aria-describedby={tier.id}
                            className={classNames(
                                tier.mostPopular
                                    ? 'bg-green-500 text-white shadow-sm hover:bg-green-500'
                                    : 'text-green-500 ring-1 ring-inset ring-indigo-200 hover:ring-green-500',
                                'mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500',
                            )}
                        >
                            Buy plan
                        </a>
                    </div>
                ))}
            </div>
            <div className=" mt-64">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <h1 className='text-3xl text-green-500 font-bold'>Individual</h1>
                    <div className="mt-20  flow-root">
                        <div className="isolate  grid max-w-sm bg-gray-300 rounded-3xl grid-cols-1  divide-y divide-gray-100 sm:mx-auto lg:-mx-8 lg:mt-0 lg:max-w-none lg:grid-cols-3 lg:divide-x lg:divide-y-0 xl:-mx-4">
                            {individualtiers.map((tier) => (
                                <div key={tier.id} className=" mx-6 mb-12  lg:px-8 lg:pt-0 xl:px-14">
                                    <h3 id={tier.id} className="text-base mt-12 font-semibold leading-7 text-gray-900">
                                        {tier.name} 
                                    </h3>
                                    <p className='mt-2'>
                                        {tier.description}
                                    </p>
                                    <p className="mt-6 flex items-baseline gap-x-1">
                                        <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price.monthly} credits</span>
                                        <span className="text-sm font-semibold leading-6 text-gray-600"></span>
                                    </p>
                                    <a
                                        href={tier.href}
                                        aria-describedby={tier.id}
                                        className="mt-10 mb-3 block rounded-md bg-green-500 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
                                    >
                                        Buy plan
                                    </a>
                                    {/* <ul role="list" className="mt-6 space-y-3 text-sm leading-6 text-gray-600">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex gap-x-3">
                                                <CheckCircleIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul> */}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
